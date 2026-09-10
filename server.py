from flask import Flask, request, send_file, jsonify
from flask_cors import CORS
import yt_dlp
import os
import uuid
import glob

app = Flask(__name__)
CORS(app)

DOWNLOAD_FOLDER = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "downloads"
)

os.makedirs(DOWNLOAD_FOLDER, exist_ok=True)


# ==========================================
# HOME
# ==========================================

@app.route("/")
def home():
    return jsonify({
        "status": "online",
        "message": "VideoYTFX downloader server is running"
    })


# ==========================================
# DOWNLOAD
# ==========================================

@app.route("/download", methods=["POST"])
def download():

    try:

        data = request.get_json()

        if not data:
            return jsonify({
                "error": "No data received"
            }), 400


        url = data.get("url", "").strip()

        download_type = data.get(
            "type",
            "video"
        )

        quality = data.get(
            "quality",
            "best"
        )


        # ==================================
        # CHECK URL
        # ==================================

        if not url:

            return jsonify({
                "error": "YouTube URL is required"
            }), 400


        if (
            "youtube.com" not in url
            and "youtu.be" not in url
        ):

            return jsonify({
                "error": "Invalid YouTube URL"
            }), 400


        # ==================================
        # UNIQUE FILE NAME
        # ==================================

        file_id = str(uuid.uuid4())


        # ==================================
        # VIDEO FORMAT
        # ==================================

        if download_type == "video":

            if quality == "best":

                format_string = (
                    "bestvideo+bestaudio/"
                    "best"
                )

            elif quality == "1080":

                format_string = (
                    "bestvideo[height<=1080]+"
                    "bestaudio/"
                    "best[height<=1080]"
                )

            elif quality == "720":

                format_string = (
                    "bestvideo[height<=720]+"
                    "bestaudio/"
                    "best[height<=720]"
                )

            elif quality == "480":

                format_string = (
                    "bestvideo[height<=480]+"
                    "bestaudio/"
                    "best[height<=480]"
                )

            elif quality == "360":

                format_string = (
                    "bestvideo[height<=360]+"
                    "bestaudio/"
                    "best[height<=360]"
                )

            else:

                format_string = (
                    "bestvideo+bestaudio/"
                    "best"
                )


            output_template = os.path.join(
                DOWNLOAD_FOLDER,
                f"{file_id}.%(ext)s"
            )


            ydl_options = {

                "format": format_string,

                "outtmpl": output_template,

                "merge_output_format": "mp4",

                "noplaylist": True,

                "quiet": True,

                "no_warnings": True,

            }


        # ==================================
        # AUDIO
        # ==================================

        elif download_type == "audio":

            output_template = os.path.join(
                DOWNLOAD_FOLDER,
                f"{file_id}.%(ext)s"
            )


            ydl_options = {

                "format": "bestaudio/best",

                "outtmpl": output_template,

                "noplaylist": True,

                "quiet": True,

                "no_warnings": True,

                "postprocessors": [

                    {
                        "key": "FFmpegExtractAudio",

                        "preferredcodec": "mp3",

                        "preferredquality": "192",
                    }

                ],

            }


        else:

            return jsonify({
                "error": "Invalid download type"
            }), 400


        # ==================================
        # DOWNLOAD WITH YT-DLP
        # ==================================

        with yt_dlp.YoutubeDL(
            ydl_options
        ) as ydl:

            ydl.download([url])


        # ==================================
        # FIND DOWNLOADED FILE
        # ==================================

        files = glob.glob(
            os.path.join(
                DOWNLOAD_FOLDER,
                f"{file_id}.*"
            )
        )


        if not files:

            return jsonify({
                "error": "Downloaded file was not found"
            }), 500


        file_path = files[0]


        # ==================================
        # SEND FILE TO BROWSER
        # ==================================

        if download_type == "audio":

            download_name = (
                "VideoYTFX-Audio.mp3"
            )

        else:

            download_name = (
                "VideoYTFX-Video.mp4"
            )


        response = send_file(

            file_path,

            as_attachment=True,

            download_name=download_name

        )


        # ==================================
        # DELETE FILE AFTER DOWNLOAD
        # ==================================

        @response.call_on_close
        def cleanup():

            try:

                if os.path.exists(file_path):

                    os.remove(file_path)

            except Exception:

                pass


        return response


    except Exception as error:

        print(
            "DOWNLOAD ERROR:",
            error
        )

        return jsonify({

            "error":
                "Download failed",
            
            "details":
                str(error)

        }), 500


# ==========================================
# RUN SERVER
# ==========================================

if __name__ == "__main__":

    print("")
    print("==============================")
    print("       VideoYTFX Server")
    print("==============================")
    print("")
    print("Server running at:")
    print("http://127.0.0.1:5000")
    print("")

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )
