import os

from flask import Flask, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv

from database import db
from models.report import Report
from routes.reports import reports_bp


# Load environment variables
load_dotenv()


# Create Flask application
app = Flask(__name__)


# Enable CORS so the frontend
# running on port 5500 can communicate
# with the backend running on port 5000
CORS(app)


# =========================
# DATABASE CONFIGURATION
# =========================

app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
    "DATABASE_URL"
)

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False


# =========================
# FILE UPLOAD CONFIGURATION
# =========================

app.config["UPLOAD_FOLDER"] = os.path.join(
    os.path.dirname(__file__),
    "uploads"
)


# Create uploads folder if it
# does not already exist
os.makedirs(
    app.config["UPLOAD_FOLDER"],
    exist_ok=True
)


# =========================
# INITIALIZE DATABASE
# =========================

db.init_app(app)


# =========================
# REGISTER API ROUTES
# =========================

app.register_blueprint(reports_bp)


# =========================
# HOME ROUTE
# =========================

@app.route("/")
def home():

    return {
        "message": "ZeroWasteWay backend is running!"
    }


# =========================
# SERVE UPLOADED IMAGES
# =========================

@app.route("/uploads/<filename>")
def uploaded_file(filename):

    return send_from_directory(
        app.config["UPLOAD_FOLDER"],
        filename
    )


# =========================
# CREATE DATABASE TABLES
# =========================

with app.app_context():

    db.create_all()


# =========================
# RUN SERVER
# =========================

if __name__ == "__main__":

    app.run(
        debug=True
    )