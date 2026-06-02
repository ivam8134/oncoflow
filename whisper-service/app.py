from flask import Flask, request, jsonify
from flask_cors import CORS
import whisper
import tempfile
import os
import subprocess
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

MODEL_SIZE = os.environ.get("WHISPER_MODEL", "medium")
logger.info(f"Loading Whisper model: {MODEL_SIZE} ...")
model = whisper.load_model(MODEL_SIZE)
logger.info("Model ready.")

SUPPORTED_LANGUAGES = {"en": "English", "fr": "French", "ar": "Arabic"}

# ── Audio conversion ───────────────────────────────────────────────────────────

def convert_to_wav(input_path: str) -> str:
    """
    Convert any browser audio format (webm, ogg, mp4) to a clean 16 kHz
    mono WAV that Whisper reads perfectly every time.
    Returns the path to the new .wav file (caller must delete it).
    """
    output_path = input_path + "_converted.wav"
    cmd = [
        "ffmpeg",
        "-y",                    # overwrite output if exists
        "-i", input_path,        # input file
        "-ar", "16000",          # 16 kHz sample rate (Whisper's native rate)
        "-ac", "1",              # mono
        "-c:a", "pcm_s16le",     # standard 16-bit PCM
        output_path,
        "-loglevel", "error",    # suppress ffmpeg spam, only show errors
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"ffmpeg conversion failed: {result.stderr}")
    return output_path


# ── Language detection + transcription ────────────────────────────────────────

def _build_prompt(lang: str) -> str:
    return {
        "en": (
            "This is an oncology clinical note. "
            "Medical terms: chemotherapy, radiotherapy, metastasis, biopsy, "
            "pathology, remission, EGFR, HER2, ER positive, PR negative, "
            "neutropenia, nausea, fatigue, neuropathy."
        ),
        "fr": (
            "Ceci est une note clinique en oncologie. "
            "Termes médicaux : chimiothérapie, radiothérapie, métastase, "
            "biopsie, anatomopathologie, rémission, récepteurs hormonaux, "
            "neutropénie, nausée, fatigue, neuropathie."
        ),
        "ar": (
            "هذه ملاحظة سريرية في مجال طب الأورام. "
            "المصطلحات الطبية: العلاج الكيميائي، العلاج الإشعاعي، "
            "الورم الخبيث، خزعة، علم الأمراض، الهجوع، "
            "قلة العدلات، غثيان، إرهاق، اعتلال الأعصاب."
        ),
    }.get(lang, "")


def detect_and_transcribe(wav_path: str, hint: str | None):
    lang_scores = {}

    if hint and hint in SUPPORTED_LANGUAGES:
        detected_lang = hint
        logger.info(f"Using language hint: {hint}")
    else:
        logger.info("Detecting language...")
        audio = whisper.load_audio(wav_path)
        clip  = whisper.pad_or_trim(audio)
        mel   = whisper.log_mel_spectrogram(clip).to(model.device)
        _, probs = model.detect_language(mel)

        # Only score our three target languages
        lang_scores = {k: float(probs.get(k, 0.0)) for k in SUPPORTED_LANGUAGES}
        detected_lang = max(lang_scores, key=lang_scores.get)
        confidence    = lang_scores[detected_lang]

        logger.info(f"Scores: {lang_scores}")
        logger.info(f"Detected: {detected_lang} ({confidence:.1%})")

        if confidence < 0.30:
            logger.warning(f"Low confidence ({confidence:.1%}), defaulting to 'en'")
            detected_lang = "en"

    logger.info(f"Transcribing as '{detected_lang}'...")
    result = model.transcribe(
        wav_path,
        language=detected_lang,
        task="transcribe",
        beam_size=5,
        best_of=5,
        temperature=0.0,
        compression_ratio_threshold=2.4,
        logprob_threshold=-1.0,
        no_speech_threshold=0.6,
        condition_on_previous_text=True,
        word_timestamps=True,
        initial_prompt=_build_prompt(detected_lang),
    )

    if not lang_scores:
        lang_scores = {detected_lang: 1.0}

    return result, detected_lang, lang_scores


# ── Routes ─────────────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model": MODEL_SIZE})


@app.route("/transcribe", methods=["POST"])
def transcribe():
    if "audio" not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    audio_file = request.files["audio"]
    lang_hint  = request.form.get("language") or None
    if lang_hint and lang_hint not in SUPPORTED_LANGUAGES:
        lang_hint = None

    # 1. Save the raw upload (any format)
    suffix = os.path.splitext(audio_file.filename or "")[1] or ".webm"
    raw_tmp = wav_tmp = None

    try:
        # Save raw browser audio
        with tempfile.NamedTemporaryFile(
            delete=False, suffix=suffix
        ) as raw_f:
            audio_file.save(raw_f.name)
            raw_tmp = raw_f.name
        logger.info(
            f"Saved upload: {raw_tmp} "
            f"({os.path.getsize(raw_tmp)} bytes, type={suffix})"
        )

        # 2. Convert to 16 kHz mono WAV
        wav_tmp = convert_to_wav(raw_tmp)
        logger.info(
            f"Converted to WAV: {wav_tmp} "
            f"({os.path.getsize(wav_tmp)} bytes)"
        )

        # 3. Transcribe
        result, detected_lang, lang_scores = detect_and_transcribe(
            wav_tmp, lang_hint
        )

        # 4. Build response
        words = [
            {
                "word":        w["word"],
                "start":       round(w["start"], 2),
                "end":         round(w["end"], 2),
                "probability": round(w.get("probability", 1.0), 3),
            }
            for seg in result.get("segments", [])
            for w   in seg.get("words", [])
        ]

        return jsonify({
            "text":            result["text"].strip(),
            "language":        detected_lang,
            "language_scores": {k: round(v, 4) for k, v in lang_scores.items()},
            "segments": [
                {
                    "id":            s["id"],
                    "start":         round(s["start"], 2),
                    "end":           round(s["end"], 2),
                    "text":          s["text"].strip(),
                    "avg_logprob":   round(s.get("avg_logprob", 0), 4),
                    "no_speech_prob":round(s.get("no_speech_prob", 0), 4),
                }
                for s in result.get("segments", [])
            ],
            "words": words,
        })

    except Exception as e:
        logger.exception("Transcription failed")
        return jsonify({"error": str(e)}), 500

    finally:
        for path in [raw_tmp, wav_tmp]:
            if path and os.path.exists(path):
                try:
                    os.unlink(path)
                except Exception:
                    pass


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=9000, debug=False)