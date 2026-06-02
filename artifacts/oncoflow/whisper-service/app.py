from flask import Flask, request, jsonify
from flask_cors import CORS
import whisper
import tempfile
import os

app = Flask(__name__)
CORS(app)

# Load model once at startup.
# Options: "tiny", "base", "small", "medium", "large"
# "base" is a good balance of speed and accuracy for clinical notes.
model = whisper.load_model("base")

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok", "model": "base"})

@app.route("/transcribe", methods=["POST"])
def transcribe():
    if "audio" not in request.files:
        return jsonify({"error": "No audio file provided"}), 400

    audio_file = request.files["audio"]

    # Save to a temp file (Whisper needs a file path)
    suffix = os.path.splitext(audio_file.filename)[1] or ".webm"
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
        audio_file.save(tmp.name)
        tmp_path = tmp.name

    try:
        result = model.transcribe(tmp_path, language="en")
        return jsonify({
            "text": result["text"].strip(),
            "segments": result.get("segments", [])
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    finally:
        os.unlink(tmp_path)

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=9000, debug=False)