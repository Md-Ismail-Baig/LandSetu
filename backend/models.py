"""
LandSetu Backend — Pydantic Models

Request/response schemas for the API, including departmental domain schemas,
the aggregated Integrated Parcel View schema, and Grounded AI Assistant schemas.
"""

from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


class ParcelSummary(BaseModel):
    """Lightweight parcel representation for list views."""
    ulpin: str = Field(..., description="Unique Land Parcel Identification Number")
    survey_number: str
    owner_name: str
    district: str
    taluk: str
    village: str
    area_hectares: float
    land_type: str
    status: str


class ParcelDetail(BaseModel):
    """Full parcel record for detail views."""
    ulpin: str = Field(..., description="Unique Land Parcel Identification Number")
    survey_number: str
    owner_name: str
    father_name: Optional[str] = None
    area_hectares: float
    area_acres: float
    district: str
    taluk: str
    hobli: str
    village: str
    state: str
    land_type: str
    land_use: str
    status: str
    last_transaction_date: Optional[str] = None
    encumbrances: list = Field(default_factory=list)
    created_at: str
    updated_at: str


class HealthCheckResponse(BaseModel):
    """Health check response."""
    status: str = "ok"
    version: str
    disclaimer: str


class ParcelListResponse(BaseModel):
    """Response wrapper for parcel list endpoint."""
    count: int
    parcels: List[ParcelSummary]
    disclaimer: str


class ParcelDetailResponse(BaseModel):
    """Response wrapper for single parcel endpoint."""
    parcel: ParcelDetail
    disclaimer: str


class GeoJSONResponse(BaseModel):
    """GeoJSON Feature response for a parcel's geometry."""
    type: str = "Feature"
    properties: dict
    geometry: dict


class ErrorResponse(BaseModel):
    """Standard error response."""
    error: str
    detail: str


# ==========================================
# Departmental Domain Models (Phase 3)
# ==========================================

class OwnershipDetail(BaseModel):
    """Revenue & Land Records Department — Title & Ownership details."""
    ulpin: str
    owner_name: str
    owner_type: str = "Individual / Sole Owner"
    father_or_spouse_name: Optional[str] = None
    share_percentage: float = 100.0
    khata_number: str
    mutation_number: str
    record_reference: str
    status: str = "Verified"
    last_updated: str


class RegistrationDetail(BaseModel):
    """Inspector General of Registration (IGR) — Deed & Registration details."""
    ulpin: str
    sro_office: str
    deed_type: str
    document_number: str
    book_number: str
    registration_date: str
    stamp_duty_paid: float
    registration_fee_paid: float
    status: str = "Registered"
    verification_source: str = "State e-Registration Portal"


class TaxDetail(BaseModel):
    """Municipal / Gram Panchayat Revenue — Property Tax Assessment details."""
    ulpin: str
    authority: str
    property_tax_id: str
    assessment_year: str
    annual_tax_assessed: float
    outstanding_amount: float
    last_payment_date: Optional[str] = None
    last_receipt_number: Optional[str] = None
    payment_status: str


class PlanningDetail(BaseModel):
    """Town & Country Planning — Master Plan, Zoning, and Land Conversion."""
    ulpin: str
    planning_authority: str
    master_plan_zone: str
    permissible_land_use: str
    permissible_far: float
    conversion_status: str
    conversion_order_no: Optional[str] = None
    development_status: str
    green_belt_clearance: str


class UtilitiesDetail(BaseModel):
    """Public Utilities & Infrastructure — Electricity, Water, Road Access."""
    ulpin: str
    electricity_provider: str
    electricity_consumer_id: Optional[str] = None
    electricity_status: str
    water_authority: str
    water_consumer_id: Optional[str] = None
    water_status: str
    road_access_type: str
    road_width_feet: float
    sewage_drainage_status: str


class RestrictionsDetail(BaseModel):
    """Legal, Environmental & Administrative Encumbrance Alerts."""
    ulpin: str
    status: str
    court_stay_status: str
    land_acquisition_status: str
    ceiling_act_status: str
    mortgage_status: str
    alert_flags: List[str] = Field(default_factory=list)
    remarks: str


class TransactionRecord(BaseModel):
    """Audited mutation or transaction event."""
    id: str
    date: str
    transaction_type: str
    reference_number: str
    department: str
    parties_involved: str
    status: str


# ==========================================
# Aggregated Integrated View Schema
# ==========================================

class IntegratedParcelViewResponse(BaseModel):
    """One Integrated Parcel View — aggregated ecosystem data."""
    parcel: ParcelDetail
    ownership: OwnershipDetail
    registration: RegistrationDetail
    tax: TaxDetail
    planning: PlanningDetail
    utilities: UtilitiesDetail
    restrictions: RestrictionsDetail
    transactions: List[TransactionRecord]
    map: Optional[Dict[str, Any]] = None
    disclaimer: str


# ==========================================
# Grounded AI / RAG Models
# ==========================================

class AIQueryRequest(BaseModel):
    """Query request for Grounded AI parcel assistant."""
    ulpin: str = Field(..., description="Unique Land Parcel Identification Number")
    query: str = Field(..., min_length=1, description="Natural language question about the parcel")


class AIQueryResponse(BaseModel):
    """Structured response from Grounded AI parcel assistant."""
    ulpin: str
    query: str
    answer: str
    sources: List[str]
    mode: str = Field("grounded", description="AI mode: grounded or real_llm")
    disclaimer: str


# ==========================================
# Satellite Change Monitoring Models
# ==========================================

class SatelliteImageInfo(BaseModel):
    """Metadata for a single satellite capture."""
    date: str
    image_url: str
    label: str = "Capture"


class SatelliteChangeInfo(BaseModel):
    """Change detection result."""
    detected: bool
    changed_area_sqm: float = 0.0
    change_percentage: float = 0.0
    type: Optional[str] = None
    confidence: float = 0.0


class SatelliteResponse(BaseModel):
    """Satellite change monitoring response for a parcel."""
    ulpin: str
    analysis_status: str = Field(..., description="possible_change | no_change | unavailable")
    source_type: str = Field("simulated", description="Data source: simulated or live")
    previous: SatelliteImageInfo
    current: SatelliteImageInfo
    change: SatelliteChangeInfo
    requires_verification: bool = False
    officer_remarks: Optional[str] = None


# ==========================================
# Authentication & User Models (Phase 6 / 7)
# ==========================================

class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1)
    password: str = Field(..., min_length=1)


class SignupRequest(BaseModel):
    name: str = Field(..., min_length=2, description="Full Name")
    email: str = Field(..., description="Email address")
    mobile: Optional[str] = Field(None, description="Mobile number")
    password: str = Field(..., min_length=4, description="Account password")
    role: str = Field(..., description="Citizen | Revenue Officer | Registration Officer | Municipal Officer")
    department: Optional[str] = None


class UserPayload(BaseModel):
    username: str
    name: str
    role: str
    email: Optional[str] = None
    mobile: Optional[str] = None
    department: Optional[str] = None
    status: Optional[str] = "ACTIVE"
    created_at: Optional[str] = None


class UserRecord(BaseModel):
    username: str
    name: str
    role: str
    email: Optional[str] = None
    mobile: Optional[str] = None
    department: Optional[str] = None
    status: str = "ACTIVE"
    created_at: str


class AdminUserListResponse(BaseModel):
    count: int
    users: List[UserRecord]
    disclaimer: str


class AdminSystemStatsResponse(BaseModel):
    total_users: int
    total_citizens: int
    total_officers: int
    total_parcels: int
    total_requests: int
    pending_verifications: int
    audit_events_count: int
    disclaimer: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPayload


# ==========================================
# Verification Workflow Models (Phase 6 / 7)
# ==========================================

class VerificationCreateRequest(BaseModel):
    remarks: Optional[str] = "Review required based on simulated satellite change."


class VerificationReviewRequest(BaseModel):
    remarks: str = Field(..., min_length=1, description="Official review remarks")


class VerificationRecord(BaseModel):
    verification_id: str
    ulpin: str
    status: str = Field("PENDING", description="PENDING | APPROVED | REJECTED")
    requested_by: str
    reviewed_by: Optional[str] = None
    change_type: Optional[str] = "Possible New Construction"
    remarks: Optional[str] = None
    decision: Optional[str] = None
    created_at: str
    reviewed_at: Optional[str] = None


# ==========================================
# Audit Trail Models (Phase 6 / 7)
# ==========================================

class AuditEventRecord(BaseModel):
    event_id: str
    timestamp: str
    username: str
    role: str
    ulpin: Optional[str] = None
    action: str
    status: str
    remarks: Optional[str] = None
    verification_id: Optional[str] = None


class AuditListResponse(BaseModel):
    ulpin: Optional[str] = None
    count: int
    events: List[AuditEventRecord]
    disclaimer: str


# ==========================================
# Generic Service Request Framework Models (Phase 7)
# ==========================================

class ServiceRequestCreateRequest(BaseModel):
    ulpin: str = Field(..., description="Target parcel ULPIN")
    service_type: str = Field(..., description="PARCEL_VERIFICATION | DOCUMENT_VERIFICATION | LAND_TRANSFER | PARCEL_SUBDIVISION")
    description: str = Field(..., min_length=1)
    priority: Optional[str] = "Normal"
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict)


class ServiceRequestUpdateRequest(BaseModel):
    status: Optional[str] = Field(None, description="UNDER_REVIEW | PENDING_DOCUMENTS | APPROVED | REJECTED | COMPLETED")
    remarks: Optional[str] = None
    assigned_role: Optional[str] = None


class ServiceRequestRecord(BaseModel):
    request_id: str
    ulpin: str
    service_type: str
    applicant: str
    assigned_role: str
    status: str = Field("SUBMITTED", description="SUBMITTED | UNDER_REVIEW | PENDING_DOCUMENTS | APPROVED | REJECTED | COMPLETED")
    description: str
    priority: str = "Normal"
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: str
    updated_at: str
    linked_verification: Optional[VerificationRecord] = None


class ServiceRequestListResponse(BaseModel):
    count: int
    summary: Dict[str, int]
    requests: List[ServiceRequestRecord]
    disclaimer: str


# ==========================================
# Dashboard & Governance Summary Models (Phase 7)
# ==========================================

class DashboardSummaryMetrics(BaseModel):
    total_parcels: int
    verification_requests: int
    pending_service_requests: int
    recent_transactions: int
    satellite_alerts: int
    audit_events_count: int


class ActivityItem(BaseModel):
    id: str
    timestamp: str
    user: str
    role: str
    ulpin: Optional[str] = None
    action: str
    status: str
    details: str
    type: str = "audit"  # audit | request | satellite


class DashboardSummaryResponse(BaseModel):
    metrics: DashboardSummaryMetrics
    recent_activity: List[ActivityItem]
    disclaimer: str


# ==========================================
# Document Verification Models (Phase 8)
# ==========================================

class DocumentVerificationCreateRequest(BaseModel):
    ulpin: str = Field(..., description="Target parcel ULPIN")
    document_type: str = Field(..., description="Sale Deed | Registration Document | Property Tax Receipt | Land Ownership Document | Survey Document")
    document_name: str = Field(..., min_length=2, description="Document display title")
    document_number: Optional[str] = Field(None, description="Document deed or certificate number")
    document_date: Optional[str] = Field(None, description="Date on document (YYYY-MM-DD)")
    seller_owner_name: Optional[str] = Field(None, description="Seller or recorded owner name mentioned in document")
    buyer_applicant_name: Optional[str] = Field(None, description="Buyer or applicant name mentioned in document")
    area_mentioned: Optional[float] = Field(None, description="Land area in acres or hectares mentioned in document")
    registration_reference: Optional[str] = Field(None, description="Registration SRO reference or Book/Volume/Page")
    additional_details: Optional[str] = None


class VerificationCheckItem(BaseModel):
    check: str = Field(..., description="ULPIN | OWNER | AREA | REGISTRATION | DATE")
    name: str = Field(..., description="Human-readable check title")
    document_value: Optional[str] = "—"
    record_value: Optional[str] = "—"
    result: str = Field(..., description="MATCH | MISMATCH | NEEDS_REVIEW")
    details: str = Field(..., description="Detailed verification remarks or findings")


class VerificationEngineResult(BaseModel):
    overall_result: str = Field(..., description="MATCH | MISMATCH | NEEDS_REVIEW")
    checks: List[VerificationCheckItem]
    summary: str


class DocumentVerificationRecord(BaseModel):
    doc_verification_id: str
    request_id: str
    ulpin: str
    document_type: str
    document_name: str
    document_number: Optional[str] = None
    document_date: Optional[str] = None
    seller_owner_name: Optional[str] = None
    buyer_applicant_name: Optional[str] = None
    area_mentioned: Optional[float] = None
    registration_reference: Optional[str] = None
    additional_details: Optional[str] = None
    status: str = Field("SUBMITTED", description="SUBMITTED | UNDER_REVIEW | PENDING_DOCUMENTS | APPROVED | REJECTED")
    overall_result: str = "NEEDS_REVIEW"
    verification_checks: List[VerificationCheckItem] = Field(default_factory=list)
    submitted_by: str
    submission_date: str
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[str] = None
    remarks: Optional[str] = None
    created_at: str
    updated_at: str
    parcel_summary: Optional[Dict[str, Any]] = None


class DocumentVerificationReviewRequest(BaseModel):
    decision: str = Field(..., description="APPROVED | REJECTED")
    remarks: str = Field(..., min_length=1, description="Official review notes and legal compliance remarks")


class DocumentVerificationListResponse(BaseModel):
    count: int
    summary: Dict[str, int]
    documents: List[DocumentVerificationRecord]
    disclaimer: str


# ==========================================
# Land Sale / Ownership Transfer Models (Phase 9)
# ==========================================

class LandTransferCreateRequest(BaseModel):
    ulpin: str = Field(..., description="Target parcel ULPIN")
    buyer_name: str = Field(..., min_length=2, description="Full name of proposed buyer or transferee")
    buyer_contact: Optional[str] = Field(None, description="Buyer phone or email contact")
    buyer_id: Optional[str] = Field(None, description="Buyer ID / Aadhaar reference")
    transfer_type: str = Field("SALE", description="SALE | GIFT | INHERITANCE | PARTITION")
    area_transferred: Optional[float] = Field(None, description="Area being transferred in acres/hectares (defaults to full parcel area)")
    consideration_amount: Optional[float] = Field(0.0, description="Sale consideration value in INR")
    consideration_reference: Optional[str] = Field(None, description="Payment transaction reference / DD / Bank Challan")
    doc_verification_id: Optional[str] = Field(None, description="Linked Document Verification Request ID")
    remarks: Optional[str] = None


class LandTransferRecord(BaseModel):
    transfer_id: str
    request_id: str
    ulpin: str
    seller_name: str
    seller_id: Optional[str] = None
    buyer_name: str
    buyer_contact: Optional[str] = None
    buyer_id: Optional[str] = None
    transfer_type: str = "SALE"
    area_transferred: float
    consideration_amount: float = 0.0
    consideration_reference: Optional[str] = None
    doc_verification_id: Optional[str] = None
    registration_reference: Optional[str] = None
    status: str = Field("SUBMITTED", description="SUBMITTED | UNDER_REVIEW | APPROVED | REJECTED | COMPLETED")
    tax_status: str = "PENDING"
    restriction_status: str = "PENDING"
    overall_eligibility: str = "NEEDS_REVIEW"
    eligibility_checks: List[Dict[str, Any]] = Field(default_factory=list)
    submitted_by: str
    submission_date: str
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[str] = None
    remarks: Optional[str] = None
    created_at: str
    updated_at: str
    parcel_summary: Optional[Dict[str, Any]] = None


class LandTransferReviewRequest(BaseModel):
    decision: str = Field(..., description="APPROVED | REJECTED")
    remarks: str = Field(..., min_length=1, description="Official review remarks and registration seal notes")


class LandTransferListResponse(BaseModel):
    count: int
    summary: Dict[str, int]
    transfers: List[LandTransferRecord]
    disclaimer: str


# ==========================================
# Parcel Subdivision Models (Phase 10)
# ==========================================

class ChildParcelProposal(BaseModel):
    """Proposed child parcel information submitted with subdivision request."""
    child_index: int = Field(..., description="Child parcel number (1, 2, or 3)")
    owner_name: str = Field(..., min_length=2, description="Proposed owner name for this child parcel")
    area_acres: float = Field(..., gt=0, description="Proposed area in acres")
    remarks: Optional[str] = None


class SubdivisionCreateRequest(BaseModel):
    """Request payload to initiate a parcel subdivision."""
    parent_ulpin: str = Field(..., description="ULPIN of the parent parcel to subdivide")
    num_children: int = Field(..., ge=2, le=3, description="Number of child parcels (2 or 3)")
    proposed_children: List[ChildParcelProposal] = Field(..., description="Proposed child parcel details")
    reason: Optional[str] = Field(None, description="Reason or purpose for subdivision")
    supporting_doc_id: Optional[str] = Field(None, description="Linked Document Verification ID")


class SubdivisionValidationCheck(BaseModel):
    """Single point in the 10-point subdivision validation matrix."""
    check: str
    name: str
    result: str = Field(..., description="PASS | FAIL | NEEDS_REVIEW")
    details: str


class SubdivisionValidationResult(BaseModel):
    """Full 10-point validation matrix result."""
    overall_result: str = Field(..., description="VALID | INVALID | NEEDS_REVIEW")
    checks: List[SubdivisionValidationCheck]
    summary: str


class ChildParcelRecord(BaseModel):
    """Created child parcel record after subdivision approval."""
    child_parcel_id: str
    parent_ulpin: str
    subdivision_id: str
    child_index: int
    owner_name: str
    area_acres: float
    area_hectares: float
    land_type: str
    land_use: str
    status: str = "Active"
    geometry: Optional[Dict[str, Any]] = None
    created_at: str


class SubdivisionRecord(BaseModel):
    """Full parcel subdivision request record."""
    subdivision_id: str
    request_id: str
    parent_ulpin: str
    applicant: str
    num_children: int
    proposed_children: List[ChildParcelProposal] = Field(default_factory=list)
    reason: Optional[str] = None
    supporting_doc_id: Optional[str] = None
    status: str = Field("SUBMITTED", description="SUBMITTED | UNDER_REVIEW | APPROVED | REJECTED | COMPLETED")
    tax_status: str = "PENDING"
    restriction_status: str = "PENDING"
    validation_result: str = "PENDING"
    validation_checks: List[SubdivisionValidationCheck] = Field(default_factory=list)
    child_parcels: List[ChildParcelRecord] = Field(default_factory=list)
    reviewed_by: Optional[str] = None
    reviewed_at: Optional[str] = None
    remarks: Optional[str] = None
    created_at: str
    updated_at: str
    parent_parcel_summary: Optional[Dict[str, Any]] = None


class SubdivisionReviewRequest(BaseModel):
    """Officer review/approval/rejection payload."""
    decision: str = Field(..., description="APPROVED | REJECTED")
    remarks: str = Field(..., min_length=1, description="Official review remarks")


class SubdivisionListResponse(BaseModel):
    count: int
    summary: Dict[str, int]
    subdivisions: List[SubdivisionRecord]
    disclaimer: str
