from datetime import datetime
from zoneinfo import ZoneInfo

from database import db

IST = ZoneInfo("Asia/Kolkata")

class Report(db.Model):
    __tablename__ = "reports"

    # Basic report information
    id = db.Column(db.Integer, primary_key=True)

    # Citizen who submitted the report
    user_id = db.Column(db.String(255), nullable=False)

    # Photo showing the trash before cleanup
    before_photo = db.Column(db.String(255), nullable=False)

    # Address/location entered by citizen
    location = db.Column(db.String(500), nullable=False)

    # Time when the report was submitted
    reported_at = db.Column(
        db.DateTime,
        nullable=False,
        default=lambda: datetime.now(IST)
    )

    # Description of the problem
    description = db.Column(db.Text, nullable=False)

    # PENDING → ACCEPTED → COMPLETED
    status = db.Column(
        db.String(20),
        nullable=False,
        default="PENDING"
    )

    # Cleaner/partner who accepted the report
    accepted_by = db.Column(
        db.String(255),
        nullable=True
    )

    # Photo uploaded by cleaner after cleanup
    after_photo = db.Column(
        db.String(255),
        nullable=True
    )

    # Time when cleanup was completed
    completed_at = db.Column(
        db.DateTime,
        nullable=True
    )

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "before_photo": self.before_photo,
            "location": self.location,
            "reported_at": (
                self.reported_at.isoformat()
                if self.reported_at
                else None
            ),
            "description": self.description,
            "status": self.status,
            "accepted_by": self.accepted_by,
            "after_photo": self.after_photo,
            "completed_at": (
                self.completed_at.isoformat()
                if self.completed_at
                else None
            )
        }