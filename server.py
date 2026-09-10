from flask import Flask, request, jsonify
import requests
import os

app = Flask(__name__)

# =========================================================
# A5 CONFIG
# =========================================================

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"

OPENROUTER_API_KEY = os.environ.get(
    "OPENROUTER_API_KEY"
)

DEFAULT_MODEL = "openrouter/free"

SITE_URL = (
    "https://mohammed100ried-blip.github.io/"
    "VideoYTFX/"
)

SITE_NAME = "A5 AI"


# =========================================================
# CHAT API
# =========================================================

@app.route("/api/chat", methods=["POST"])
def chat():

    # Check API key
    if not OPENROUTER_API_KEY:

        return jsonify({
            "error": {
                "message":
                    "OPENROUTER_API_KEY is not configured on the server."
            }
        }), 500


    try:

        # Read JSON
        data = request.get_json(
            silent=True
        )


        if not data:

            return jsonify({
                "error": {
                    "message":
                        "Invalid JSON request."
                }
            }), 400


        # Get messages
        messages = data.get(
            "messages",
            []
        )


        if not messages:

            return jsonify({
                "error": {
                    "message":
                        "No messages were provided."
                }
            }), 400


        # Get model
        model = data.get(
            "model",
            DEFAULT_MODEL
        )


        # Request body
        payload = {

            "model": model,

            "messages": messages,

            "temperature":
                data.get(
                    "temperature",
                    0.7
                ),

            "max_tokens":
                data.get(
                    "max_tokens",
                    2500
                )
        }


        # OpenRouter headers
        headers = {

            "Authorization":
                f"Bearer {OPENROUTER_API_KEY}",

            "Content-Type":
                "application/json",

            "HTTP-Referer":
                SITE_URL,

            "X-Title":
                SITE_NAME
        }


        # Send request to OpenRouter
        response = requests.post(

            OPENROUTER_URL,

            headers=headers,

            json=payload,

            timeout=120
        )


        # Read response
        try:

            result = response.json()

        except ValueError:

            result = {

                "error": {

                    "message":
                        response.text
                        or
                        "Invalid response from OpenRouter."
                }
            }


        # Return OpenRouter response
        return jsonify(
            result
        ), response.status_code


    except requests.Timeout:

        return jsonify({

            "error": {

                "message":
                    "The AI request timed out."
            }

        }), 504


    except requests.RequestException as error:

        return jsonify({

            "error": {

                "message":
                    f"OpenRouter connection error: {error}"
            }

        }), 502


    except Exception as error:

        return jsonify({

            "error": {

                "message":
                    f"Server error: {error}"
            }

        }), 500


# =========================================================
# HEALTH CHECK
# =========================================================

@app.route(
    "/api/health",
    methods=["GET"]
)
def health():

    return jsonify({

        "status":
            "online",

        "assistant":
            "A5 AI",

        "openrouter_configured":
            bool(
                OPENROUTER_API_KEY
            )
    })


# =========================================================
# HOME
# =========================================================

@app.route(
    "/",
    methods=["GET"]
)
def home():

    return jsonify({

        "name":
            "A5 AI",

        "status":
            "online"
    })


# =========================================================
# START SERVER
# =========================================================

if __name__ == "__main__":

    port = int(
        os.environ.get(
            "PORT",
            5000
        )
    )


    app.run(

        host="0.0.0.0",

        port=port,

        debug=False
    )
