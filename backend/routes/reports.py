import os
import uuid
from datetime import datetime

from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename

from database import db
from models.report import Report


reports_bp = Blueprint(
    "reports",
    __name__,
    url_prefix="/api/reports"
)


# --------------------------------------------------
# Helper: save uploaded image
# --------------------------------------------------

def save_image(file):
    if not file or file.filename == "":
        return None

    filename = secure_filename(file.filename)

    # Give every uploaded file a unique name
    unique_filename = f"{uuid.uuid4().hex}_{filename}"

    filepath = os.path.join(
        current_app.config["UPLOAD_FOLDER"],
        unique_filename
    )

    file.save(filepath)

    return unique_filename


# --------------------------------------------------
# 1. Citizen submits a new trash report
# POST /api/reports
# --------------------------------------------------

@reports_bp.route("", methods=["POST"])
def create_report():

    # Get form data
    user_id = request.form.get("user_id")
    location = request.form.get("location")
    description = request.form.get("description")

    # Get uploaded photo
    before_photo = request.files.get("before_photo")

    # Validate required fields
    if not user_id:
        return jsonify({
            "error": "user_id is required"
        }), 400

    if not location:
        return jsonify({
            "error": "location is required"
        }), 400

    if not description:
        return jsonify({
            "error": "description is required"
        }), 400

    if not before_photo:
        return jsonify({
            "error": "before_photo is required"
        }), 400

    # Save photo
    filename = save_image(before_photo)

    if not filename:
        return jsonify({
            "error": "Invalid photo"
        }), 400

    # Create report
    report = Report(
        user_id=user_id,
        before_photo=filename,
        location=location,
        description=description,
        status="PENDING"
    )

    db.session.add(report)
    db.session.commit()

    return jsonify({
        "message": "Trash report submitted successfully",
        "report": report.to_dict()
    }), 201


# --------------------------------------------------
# 2. Get all reports submitted by a citizen
# GET /api/reports/my/<user_id>
# --------------------------------------------------

@reports_bp.route("/my/<user_id>", methods=["GET"])
def get_my_reports(user_id):

    reports = Report.query.filter_by(
        user_id=user_id
    ).order_by(
        Report.reported_at.desc()
    ).all()

    return jsonify([
        report.to_dict()
        for report in reports
    ]), 200


# --------------------------------------------------
# 3. Get pending reports for waste partners
# GET /api/reports/pending
# --------------------------------------------------

@reports_bp.route("/pending", methods=["GET"])
def get_pending_reports():

    reports = Report.query.filter_by(
        status="PENDING"
    ).order_by(
        Report.reported_at.asc()
    ).all()

    return jsonify([
        report.to_dict()
        for report in reports
    ]), 200


# --------------------------------------------------
# 4. Cleaner accepts a report
# PUT /api/reports/<report_id>/accept
# --------------------------------------------------

@reports_bp.route("/<int:report_id>/accept", methods=["PUT"])
def accept_report(report_id):

    report = db.session.get(Report, report_id)

    if not report:
        return jsonify({
            "error": "Report not found"
        }), 404

    if report.status != "PENDING":
        return jsonify({
            "error": "Only pending reports can be accepted"
        }), 400

    data = request.get_json(silent=True) or {}

    accepted_by = data.get("accepted_by")

    if not accepted_by:
        return jsonify({
            "error": "accepted_by is required"
        }), 400

    report.status = "ACCEPTED"
    report.accepted_by = accepted_by

    db.session.commit()

    return jsonify({
        "message": "Report accepted successfully",
        "report": report.to_dict()
    }), 200


# --------------------------------------------------
# 5. Cleaner completes a report with proof photo
# POST /api/reports/<report_id>/complete
# --------------------------------------------------

@reports_bp.route("/<int:report_id>/complete", methods=["POST"])
def complete_report(report_id):

    report = db.session.get(Report, report_id)

    if not report:
        return jsonify({
            "error": "Report not found"
        }), 404

    if report.status != "ACCEPTED":
        return jsonify({
            "error": "Only accepted reports can be completed"
        }), 400

    after_photo = request.files.get("after_photo")

    if not after_photo:
        return jsonify({
            "error": "after_photo is required"
        }), 400

    # Save proof photo
    filename = save_image(after_photo)

    if not filename:
        return jsonify({
            "error": "Invalid proof photo"
        }), 400

    report.after_photo = filename
    report.completed_at = datetime.utcnow()
    report.status = "COMPLETED"

    db.session.commit()

    return jsonify({
        "message": "Report completed successfully",
        "report": report.to_dict()
    }), 200


# --------------------------------------------------
# 6. Get a single report
# GET /api/reports/<report_id>
# --------------------------------------------------

@reports_bp.route("/<int:report_id>", methods=["GET"])
def get_report(report_id):

    report = db.session.get(Report, report_id)

    if not report:
        return jsonify({
            "error": "Report not found"
        }), 404

    return jsonify(
        report.to_dict()
    ), 200

@reports_bp.route("/partner/<partner_email>", methods=["GET"])
def get_partner_reports(partner_email):

    reports = Report.query.filter_by(
        accepted_by=partner_email
    ).order_by(
        Report.reported_at.desc()
    ).all()

    return jsonify([
        report.to_dict()
        for report in reports
    ]), 200