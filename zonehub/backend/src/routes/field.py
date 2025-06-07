from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from src.models.field import Field, FieldComplex
from src.models.user import User
from src.app import db
from sqlalchemy import func
from datetime import datetime

field_bp = Blueprint("field", __name__, url_prefix="/api/fields") # Added url_prefix for clarity

# Modified route to handle new search parameters
@field_bp.route("/search", methods=["GET"])
def search_fields():
    """Get all fields with advanced filtering based on type, area, and date."""
    # Get query parameters for filtering
    field_type = request.args.get("field_type")
    area = request.args.get("area") # Assuming 'area' corresponds to 'city' or a specific district field
    date_str = request.args.get("date")
    # Keep old filters for potential backward compatibility or other uses
    city = request.args.get("city") 
    min_price = request.args.get("min_price")
    max_price = request.args.get("max_price")

    # Start with base query
    query = Field.query

    # Apply filters if provided
    if field_type and field_type != 'Tất cả loại sân':
        # Assuming Field model has a 'field_type' column
        # Use ilike for case-insensitive matching if needed
        query = query.filter(Field.field_type.ilike(f"%{field_type}%")) 

    if area and area != 'Tất cả khu vực':
        # Assuming 'area' maps to 'city' or a specific 'district' column
        # Using 'city' for now, adjust if there's a different column like 'district' or 'area'
        query = query.filter(Field.city.ilike(f"%{area}%")) 
        
    if city: # Keep city filter if passed directly
         query = query.filter(Field.city.ilike(f"%{city}%"))

    if date_str:
        try:
            # This filter might need refinement based on how availability is stored (e.g., bookings table)
            # For now, just ensuring the query runs. A real implementation needs availability check.
            search_date = datetime.strptime(date_str, 
"%Y-%m-%d").date()
            # Placeholder: Add logic here to filter based on availability on the given date
            # This likely involves joining with a Bookings table and checking for time slots.
            # query = query.filter(...) 
            pass # Skipping date filtering logic for now as it requires booking info
        except ValueError:
            return jsonify({"error": "Invalid date format. Use YYYY-MM-DD."}), 400

    if min_price:
        try:
            query = query.filter(Field.price_per_hour >= float(min_price))
        except ValueError:
            pass  # Ignore invalid price format

    if max_price:
        try:
            query = query.filter(Field.price_per_hour <= float(max_price))
        except ValueError:
            pass  # Ignore invalid price format

    # Execute query and return results
    fields = query.all()
    # Add cluster_name to the dict if the Field model has a relationship
    # Assuming a relationship 'complex' exists on the Field model
    return jsonify({"fields": [field.to_dict(include_complex=True) for field in fields]}), 200


@field_bp.route("/<int:field_id>", methods=["GET"])
def get_field(field_id):
    """Get field by ID"""
    field = Field.query.get(field_id)

    if not field:
        return jsonify({"error": "Field not found"}), 404

    # Assuming to_dict can include related complex info
    return jsonify({"field": field.to_dict(include_complex=True)}), 200

@field_bp.route("/", methods=["POST"])
@jwt_required()
def create_field():
    """Create a new field (owner or admin only)"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user or user.role not in ["owner", "admin"]:
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json()
    required_fields = ["name", "address", "city", "price_per_hour", "field_type"] # Added field_type
    if not all(field in data for field in required_fields):
        return jsonify({"error": "Missing required fields"}), 400

    try:
        field = Field(
            name=data["name"],
            description=data.get("description"),
            address=data["address"],
            city=data["city"],
            field_type=data["field_type"], # Added field_type
            latitude=data.get("latitude"),
            longitude=data.get("longitude"),
            price_per_hour=data["price_per_hour"],
            complex_id=data.get("complex_id"),
            owner_id=current_user_id,
            image_url=data.get("image_url")
        )
        db.session.add(field)
        db.session.commit()
        return jsonify({
            "message": "Field created successfully",
            "field": field.to_dict(include_complex=True)
        }), 201
    except Exception as e:
        db.session.rollback()
        print(f"Error creating field: {e}") # Log the error
        return jsonify({"error": "Failed to create field"}), 500

@field_bp.route("/<int:field_id>", methods=["PUT"])
@jwt_required()
def update_field(field_id):
    """Update field by ID (owner or admin only)"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    field = Field.query.get(field_id)

    if not field:
        return jsonify({"error": "Field not found"}), 404
    if not user or (field.owner_id != current_user_id and user.role != "admin"):
        return jsonify({"error": "Unauthorized"}), 403

    data = request.get_json()
    # Update allowed fields
    for key in ["name", "description", "address", "city", "field_type", "latitude", "longitude", "price_per_hour", "image_url", "complex_id"]:
        if key in data:
            setattr(field, key, data[key])

    try:
        db.session.commit()
        return jsonify({
            "message": "Field updated successfully",
            "field": field.to_dict(include_complex=True)
        }), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error updating field: {e}") # Log the error
        return jsonify({"error": "Failed to update field"}), 500

@field_bp.route("/<int:field_id>", methods=["DELETE"])
@jwt_required()
def delete_field(field_id):
    """Delete field by ID (owner or admin only)"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    field = Field.query.get(field_id)

    if not field:
        return jsonify({"error": "Field not found"}), 404
    if not user or (field.owner_id != current_user_id and user.role != "admin"):
        return jsonify({"error": "Unauthorized"}), 403

    try:
        db.session.delete(field)
        db.session.commit()
        return jsonify({"message": "Field deleted successfully"}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Error deleting field: {e}") # Log the error
        return jsonify({"error": "Failed to delete field"}), 500

# --- Field Complex routes --- #

@field_bp.route("/complex", methods=["GET"])
def get_all_complexes():
    """Get all field complexes"""
    complexes = FieldComplex.query.all()
    return jsonify({"complexes": [c.to_dict() for c in complexes]}), 200

@field_bp.route("/complex/<int:complex_id>", methods=["GET"])
def get_complex(complex_id):
    """Get field complex by ID"""
    complex_obj = FieldComplex.query.get(complex_id)
    if not complex_obj:
        return jsonify({"error": "Field complex not found"}), 404
    return jsonify({"complex": complex_obj.to_dict()}), 200

# --- Owner specific routes --- #

@field_bp.route("/owner", methods=["GET"])
@jwt_required()
def get_owner_fields():
    """Get all fields owned by the current user (owner or admin)"""
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    if not user or user.role not in ["owner", "admin"]:
         return jsonify({"error": "Unauthorized"}), 403

    fields = Field.query.filter_by(owner_id=current_user_id).all()
    return jsonify({"fields": [field.to_dict(include_complex=True) for field in fields]}), 200

# --- Need to update Field model's to_dict method --- #
# Make sure the Field model's to_dict method includes 'field_type' 
# and optionally 'complex.name' as 'cluster_name' when include_complex=True


