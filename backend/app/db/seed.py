import hashlib
import uuid
from sqlalchemy.orm import Session

from backend.app.db.models import Chunk, Resource, ResourceTag, Tag, User
from backend.app.services.auth_service import hash_password


SEED_RESOURCES = [
    {
        "id": "rez-nsw-2024",
        "resource_type": "case_study",
        "title": "Central-West Orana Renewable Energy Zone",
        "policy_area": "Energy transition",
        "sector": "Government",
        "jurisdiction": "NSW, Australia",
        "year": 2024,
        "policy_challenge": "Community benefit sharing",
        "stakeholder_type": "NSW Government, landholders, energy developers, regional councils",
        "summary": "NSW's first Renewable Energy Zone used coordinated transmission planning, access rights, and community benefit schemes to accelerate clean energy infrastructure while managing landholder concerns.",
        "citation": "NSW Department of Planning and Environment (2024). Central-West Orana REZ Implementation Update.",
        "source": "Policy case study",
        "tags": ["renewables", "energy", "regional", "infrastructure", "community engagement"],
        "chunks": [
            "Community benefit funds need transparent eligibility rules and visible local governance.",
            "Early landholder engagement reduces approval friction and misinformation.",
            "Coordinated transmission planning is more effective than isolated project-by-project approvals.",
            "Transmission delays can strand generation projects and perceived inequity in host community benefits can create durable opposition.",
        ],
    },
    {
        "id": "telehealth-rural-2023",
        "resource_type": "research_paper",
        "title": "Digital Health Equity in Rural Communities",
        "policy_area": "Public health",
        "sector": "Health",
        "jurisdiction": "Australia",
        "year": 2023,
        "policy_challenge": "Equitable digital service access",
        "stakeholder_type": "Primary health networks, rural clinics, patients, Aboriginal community controlled health organisations",
        "summary": "Telehealth expansion improved access for remote patients, but uneven connectivity, digital literacy, and culturally safe service design limited benefits for some communities.",
        "citation": "UNSW Centre for Health Equity (2023). Telehealth Access after COVID-19.",
        "source": "Research paper",
        "tags": ["health", "rural", "equity", "digital services", "telehealth"],
        "chunks": [
            "Hybrid service models are more equitable than digital-only pathways.",
            "Trusted local intermediaries improve uptake among groups with low digital confidence.",
            "Connectivity support should be funded as a health access measure.",
            "Digital channels can widen access gaps when connectivity and devices are assumed.",
        ],
    },
    {
        "id": "sydney-transport-2022",
        "resource_type": "case_study",
        "title": "Urban Transport Reform in Sydney",
        "policy_area": "Urban planning",
        "sector": "Transport",
        "jurisdiction": "NSW, Australia",
        "year": 2022,
        "policy_challenge": "Multimodal integration",
        "stakeholder_type": "Transport for NSW, local councils, commuters, private operators",
        "summary": "Greater Sydney's transport reform combined metro expansion, light rail, bus redesign, and a 30-minute city planning objective to improve access to jobs and services.",
        "citation": "Transport for NSW (2022). Future Transport Strategy 2056 Update.",
        "source": "Policy case study",
        "tags": ["transport", "urban planning", "infrastructure", "smart cities", "equity"],
        "chunks": [
            "A clear place-based access target helps align transport and land-use decisions.",
            "Ticketing and data systems must be upgraded alongside physical infrastructure.",
            "Construction disruption requires sustained, localised community communication.",
        ],
    },
    {
        "id": "housing-first-finland-2021",
        "resource_type": "case_study",
        "title": "Housing First and Homelessness Reduction",
        "policy_area": "Social policy",
        "sector": "Housing",
        "jurisdiction": "Finland",
        "year": 2021,
        "policy_challenge": "Service coordination",
        "stakeholder_type": "Municipal governments, NGOs, social workers, health providers, tenants",
        "summary": "Finland's Housing First model reduced long-term homelessness by treating stable housing as the platform for support rather than a reward after service compliance.",
        "citation": "Y-Foundation (2021). Housing First in Finland: A Systemic Response to Homelessness.",
        "source": "International case study",
        "tags": ["housing", "homelessness", "service delivery", "social policy"],
        "chunks": [
            "Permanent housing with wraparound support outperforms temporary shelter pathways.",
            "National funding consistency enables municipalities to plan long-term supply.",
            "Case management must integrate mental health, addiction, income, and tenancy support.",
        ],
    },
    {
        "id": "bushfire-resilience-2020",
        "resource_type": "research_paper",
        "title": "Community-Led Bushfire Resilience Planning",
        "policy_area": "Climate adaptation",
        "sector": "Emergency management",
        "jurisdiction": "Australia",
        "year": 2020,
        "policy_challenge": "Local preparedness and trust",
        "stakeholder_type": "Emergency services, local councils, First Nations groups, residents, insurers",
        "summary": "Post-bushfire recovery research shows that locally led planning, Indigenous land management knowledge, and trusted communication channels improve resilience outcomes.",
        "citation": "Australian National University Disaster Solutions Hub (2020). Community Resilience after Black Summer.",
        "source": "Research report",
        "tags": ["climate", "resilience", "emergency management", "First Nations", "local government"],
        "chunks": [
            "Preparedness programs are stronger when communities co-design risk scenarios.",
            "Local knowledge and cultural burning expertise should inform hazard reduction.",
            "Recovery funding must be flexible enough for local priorities.",
        ],
    },
    {
        "id": "singapore-water-2019",
        "resource_type": "case_study",
        "title": "Singapore Integrated Water Management",
        "policy_area": "Water security",
        "sector": "Environment",
        "jurisdiction": "Singapore",
        "year": 2019,
        "policy_challenge": "Whole-of-system planning",
        "stakeholder_type": "PUB Singapore, households, industry, urban planners, schools",
        "summary": "Singapore's water strategy combines catchment management, recycled NEWater, desalination, demand management, and public education to reduce import dependence.",
        "citation": "PUB Singapore (2019). Our Water, Our Future.",
        "source": "International case study",
        "tags": ["water", "environment", "infrastructure", "public trust", "urban planning"],
        "chunks": [
            "Diversified supply portfolios reduce strategic vulnerability.",
            "Public trust in recycled water requires sustained education and transparent quality data.",
            "Pricing and conservation campaigns work best when paired with visible infrastructure investment.",
        ],
    },
    {
        "id": "indigenous-procurement-2023",
        "resource_type": "policy_report",
        "title": "Indigenous Procurement Policy Implementation Review",
        "policy_area": "Economic inclusion",
        "sector": "Procurement",
        "jurisdiction": "Australia",
        "year": 2023,
        "policy_challenge": "Inclusive procurement and supplier capability",
        "stakeholder_type": "Commonwealth agencies, Indigenous businesses, prime contractors, procurement officers",
        "summary": "Targets increased procurement from Indigenous businesses, but implementation quality depended on supplier development, contract size, and accountability for prime contractors.",
        "citation": "Australian Government Department of Finance (2023). Indigenous Procurement Policy Review.",
        "source": "Policy report",
        "tags": ["procurement", "First Nations", "economic inclusion", "implementation"],
        "chunks": [
            "Targets need capability-building support for suppliers and buyers.",
            "Unbundling large contracts can open realistic pathways for smaller enterprises.",
            "Verification and reporting reduce tokenistic subcontracting.",
        ],
    },
    {
        "id": "school-air-quality-2024",
        "resource_type": "research_paper",
        "title": "Healthy Schools Indoor Air Quality Program",
        "policy_area": "Education",
        "sector": "Schools",
        "jurisdiction": "Victoria, Australia",
        "year": 2024,
        "policy_challenge": "Evidence-based facility upgrades",
        "stakeholder_type": "Education departments, school leaders, teachers, students, facility managers",
        "summary": "School ventilation upgrades show how health evidence can be translated into facility standards, maintenance routines, and public reporting for learning environments.",
        "citation": "Victorian Department of Education (2024). Healthy Schools Ventilation Evaluation.",
        "source": "Evaluation report",
        "tags": ["education", "health", "infrastructure", "schools", "evidence translation"],
        "chunks": [
            "Operational guidance matters as much as capital equipment.",
            "CO2 monitoring makes invisible air quality issues actionable.",
            "Equity weighting helps direct upgrades to older and higher-risk schools.",
        ],
    },
]


def stable_id(prefix: str, value: str) -> str:
    return f"{prefix}_{hashlib.sha1(value.encode('utf-8')).hexdigest()[:12]}"


def seed_database(db: Session) -> None:
    if not db.get(User, "user_001"):
        db.add(User(id="user_001", username="user", password_hash=hash_password("user123"), role="user"))
    if not db.get(User, "user_002"):
        db.add(User(id="user_002", username="admin", password_hash=hash_password("admin123"), role="admin"))
    db.commit()

    if db.query(Resource).count() > 0:
        return

    seen_tags = {tag.id for tag in db.query(Tag).all()}
    for item in SEED_RESOURCES:
        if db.get(Resource, item["id"]):
            continue
        resource = Resource(
            id=item["id"],
            title=item["title"],
            resource_type=item["resource_type"],
            policy_area=item["policy_area"],
            sector=item["sector"],
            jurisdiction=item["jurisdiction"],
            year=item["year"],
            policy_challenge=item["policy_challenge"],
            stakeholder_type=item["stakeholder_type"],
            summary=item["summary"],
            source_type="seed",
            source=item["source"],
            citation=item["citation"],
            created_by="user_002",
        )
        db.add(resource)
        for tag_name in item["tags"]:
            tag_id = stable_id("tag", f"general:{tag_name.lower()}")
            if tag_id not in seen_tags:
                db.add(Tag(id=tag_id, name=tag_name, category="general"))
                seen_tags.add(tag_id)
            db.add(ResourceTag(resource_id=resource.id, tag_id=tag_id))
        chunk_texts = [item["summary"], *item["chunks"]]
        for index, text in enumerate(chunk_texts, start=1):
            db.add(
                Chunk(
                    id=f"{resource.id}-chunk-{index}",
                    resource_id=resource.id,
                    document_id=None,
                    chunk_index=index,
                    text=text,
                    page_start=index,
                    page_end=index,
                    section_title="Seed evidence",
                    token_count=len(text.split()),
                )
            )
    db.commit()
