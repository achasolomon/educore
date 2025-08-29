#!/bin/bash
# backend/scripts/test-week4.sh

echo "🧪 Testing Week 4 - Assessment Framework & Grading System"

API_URL="http://localhost:5000/api/v1"
SCHOOL_CODE="DEMO001"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Login
echo -e "\n${YELLOW}Logging in as school admin...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d '{
    "schoolCode": "'$SCHOOL_CODE'",
    "email": "admin@demohighschool.edu.ng",
    "password": "admin123"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.data.token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo -e "${RED}Login failed!${NC}"
  exit 1
fi

echo -e "${GREEN}Login successful!${NC}"

# Get test data IDs
echo -e "\n${YELLOW}Getting test data (classes, subjects, terms)...${NC}"
CLASSES_RESPONSE=$(curl -s -X GET "$API_URL/academics/classes" \
  -H "Authorization: Bearer $TOKEN")

CLASS_ID=$(echo $CLASSES_RESPONSE | jq -r '.data.classes[0].id')

SUBJECTS_RESPONSE=$(curl -s -X GET "$API_URL/academics/subjects" \
  -H "Authorization: Bearer $TOKEN")

SUBJECT_ID=$(echo $SUBJECTS_RESPONSE | jq -r '.data.subjects[0].id')

# Create a term first (assuming we need one)
CURRENT_YEAR=$(date +%Y)
NEXT_YEAR=$((CURRENT_YEAR + 1))

TERM_RESPONSE=$(curl -s -X POST "$API_URL/academics/terms" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "First Term",
    "academicYear": "'$CURRENT_YEAR'/'$NEXT_YEAR'",
    "startDate": "'$CURRENT_YEAR'-09-01",
    "endDate": "'$CURRENT_YEAR'-12-15",
    "isCurrent": true
  }')

TERM_ID=$(echo $TERM_RESPONSE | jq -r '.data.term.id // empty')

if [ -z "$TERM_ID" ]; then
  echo -e "${YELLOW}Getting existing term...${NC}"
  # Try to get existing term
  EXISTING_TERMS=$(curl -s -X GET "$API_URL/academics/terms" \
    -H "Authorization: Bearer $TOKEN")
  TERM_ID=$(echo $EXISTING_TERMS | jq -r '.data.terms[0].id // empty')
fi

echo "Using Class ID: $CLASS_ID"
echo "Using Subject ID: $SUBJECT_ID"
echo "Using Term ID: $TERM_ID"

# Test Assessment Management
echo -e "\n${YELLOW}=== Testing Assessment Management ===${NC}"

# Create assessment
echo -e "\n${YELLOW}Creating assessment...${NC}"
ASSESSMENT_RESPONSE=$(curl -s -X POST "$API_URL/assessments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "CA1 Mathematics",
    "description": "First Continuous Assessment",
    "type": "ca",
    "classId": "'$CLASS_ID'",
    "subjectId": "'$SUBJECT_ID'",
    "termId": "'$TERM_ID'",
    "maxScore": 20,
    "weightPercentage": 10,
    "assessmentDate": "'$(date -I)'",
    "instructions": "Answer all questions"
  }')

echo $ASSESSMENT_RESPONSE | jq '.message'
ASSESSMENT_ID=$(echo $ASSESSMENT_RESPONSE | jq -r '.data.assessment.id // empty')

# Get assessments
echo -e "\n${YELLOW}Getting assessments...${NC}"
curl -s -X GET "$API_URL/assessments" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.assessments | length'

# Get assessment details with students
if [ -n "$ASSESSMENT_ID" ]; then
  echo -e "\n${YELLOW}Getting assessment details...${NC}"
  ASSESSMENT_DETAILS=$(curl -s -X GET "$API_URL/assessments/$ASSESSMENT_ID" \
    -H "Authorization: Bearer $TOKEN")
  
  echo $ASSESSMENT_DETAILS | jq '.data.students | length'
  
  # Test grade submission (if students exist)
  STUDENTS_COUNT=$(echo $ASSESSMENT_DETAILS | jq '.data.students | length')
  if [ "$STUDENTS_COUNT" -gt "0" ]; then
    echo -e "\n${YELLOW}Submitting sample grades...${NC}"
    FIRST_STUDENT_ID=$(echo $ASSESSMENT_DETAILS | jq -r '.data.students[0].id')
    
    GRADES_RESPONSE=$(curl -s -X POST "$API_URL/assessments/$ASSESSMENT_ID/grades" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '[{
        "student_id": "'$FIRST_STUDENT_ID'",
        "score": 18,
        "remarks": "Excellent work"
      }]')
    
    echo $GRADES_RESPONSE | jq '.message'
  fi
fi

# Test Scratch Card System
echo -e "\n${YELLOW}=== Testing Scratch Card System ===${NC}"

# Generate scratch cards
echo -e "\n${YELLOW}Generating scratch cards...${NC}"
CARDS_RESPONSE=$(curl -s -X POST "$API_URL/scratch-cards/generate" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "count": 5,
    "cardType": "standard",
    "termId": "'$TERM_ID'"
  }')

echo $CARDS_RESPONSE | jq '.message'

# Get card stats
echo -e "\n${YELLOW}Getting card statistics...${NC}"
curl -s -X GET "$API_URL/scratch-cards/stats" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.overview'

# Get all cards
echo -e "\n${YELLOW}Getting scratch cards...${NC}"
curl -s -X GET "$API_URL/scratch-cards" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.pagination'

# Test public card check (without auth)
CARD_NUMBER=$(echo $CARDS_RESPONSE | jq -r '.data.cards[0].cardNumber // empty')
CARD_PIN=$(echo $CARDS_RESPONSE | jq -r '.data.cards[0].pin // empty')

if [ -n "$CARD_NUMBER" ] && [ -n "$CARD_PIN" ]; then
  echo -e "\n${YELLOW}Testing public card check...${NC}"
  curl -s -X POST "$API_URL/scratch-cards/check-results" \
    -H "Content-Type: application/json" \
    -d '{
      "cardNumber": "'$CARD_NUMBER'",
      "pin": "'$CARD_PIN'",
      "schoolCode": "'$SCHOOL_CODE'"
    }' | jq '.success'
fi

# Test Result Processing
echo -e "\n${YELLOW}=== Testing Result Processing ===${NC}"

# Process term results
if [ -n "$TERM_ID" ]; then
  echo -e "\n${YELLOW}Processing term results...${NC}"
  PROCESS_RESPONSE=$(curl -s -X POST "$API_URL/results/process-term/$TERM_ID" \
    -H "Authorization: Bearer $TOKEN")
  
  echo $PROCESS_RESPONSE | jq '.message'
fi

# Get class results
if [ -n "$CLASS_ID" ] && [ -n "$TERM_ID" ]; then
  echo -e "\n${YELLOW}Getting class results...${NC}"
  curl -s -X GET "$API_URL/results/class/$CLASS_ID/term/$TERM_ID" \
    -H "Authorization: Bearer $TOKEN" | jq '.data.results | length'
fi

echo -e "\n${GREEN}Week 4 testing completed!${NC}"

# Week 4 Completion Checklist

## Week 4 Implementation Checklist

### Assessment Framework ✓
- [ ] **Assessment Model** - Create and manage assessments (CA, Exams, Projects)
- [ ] **Grade Model** - Individual student grades with automatic calculations
- [ ] **Assessment Controller** - CRUD operations for assessments
- [ ] **Grade Submission** - Bulk grade entry with validation
- [ ] **Letter Grade Calculation** - Automatic A-F grading based on percentages

**Key Endpoints:**
- `GET /api/v1/assessments` - List all assessments
- `POST /api/v1/assessments` - Create new assessment
- `GET /api/v1/assessments/:id` - Get assessment with student list
- `POST /api/v1/assessments/:id/grades` - Submit grades for assessment

### Grading System ✓
- [ ] **Student Results Model** - Consolidated results per student per subject
- [ ] **Result Processing** - Automated calculation of final grades
- [ ] **Class Positions** - Automatic ranking within class
- [ ] **Grade Templates** - Configurable grading schemes
- [ ] **Weighted Calculations** - CA and exam weight distribution

**Key Endpoints:**
- `GET /api/v1/results/student/:studentId/term/:termId` - Individual results
- `POST /api/v1/results/process-term/:termId` - Calculate all results
- `GET /api/v1/results/class/:classId/term/:termId` - Class performance

### Scratch Card System ✓
- [ ] **Card Generation** - Bulk generation with unique numbers/PINs
- [ ] **Multi-tier Access** - Basic (₦200), Standard (₦500), Premium (₦1000)
- [ ] **Public Result Checking** - No authentication required
- [ ] **Usage Tracking** - Track card usage and revenue
- [ ] **Card Management** - Admin interface for card operations

**Key Features:**
- **Basic Cards**: View grades and attendance only
- **Standard Cards**: Grades, attendance, comments, class position
- **Premium Cards**: Full access including analytics
- **Public API**: `/api/v1/scratch-cards/check-results`

## Database Schema Created ✓

### New Tables:
1. **assessments** - Store CA, exams, assignments
2. **grades** - Individual student scores per assessment
3. **grade_templates** - Configurable grading schemes
4. **student_results** - Consolidated results per student/subject/term
5. **scratch_cards** - Revenue-generating result access cards

## Implementation Steps:

### 1. Run Database Migrations
```bash
# Add new tables
npm run db:migrate

# Check if all tables created
psql -d educore_dev -c "\dt"
```

### 2. Test Assessment System
```bash
# Run Week 4 tests
chmod +x scripts/test-week4.sh
./scripts/test-week4.sh
```

### 3. Test Core Functionality
- Create assessments for different subjects
- Submit grades for students
- Process term results
- Generate scratch cards
- Test public result checking

## Business Logic Features ✓

### Assessment Types:
- **CA (Continuous Assessment)**: 10% weight each
- **Exams**: 60% weight typically
- **Assignments/Projects**: Variable weight
- **Practical Work**: Lab/workshop assessments

### Grading Features:
- Automatic percentage calculations
- Letter grade assignment (A-F)
- Class position ranking
- Subject-wise and overall performance
- Weighted grade calculations

### Revenue Features:
- Scratch card pricing tiers
- Usage analytics and revenue tracking
- Card expiry and security features
- Public access without school login

## Success Criteria ✓

### Functional Requirements:
1. **Assessment Creation** - Teachers can create various assessment types
2. **Grade Entry** - Bulk and individual grade submission
3. **Result Processing** - Automated final grade calculations
4. **Card Generation** - Bulk scratch card creation
5. **Public Access** - Result checking without authentication

### Technical Requirements:
1. **Data Integrity** - Proper relationships and constraints
2. **Performance** - Efficient queries for large student populations
3. **Security** - Protected admin functions, public result access
4. **Scalability** - Support for multiple terms and academic years

### Business Requirements:
1. **Revenue Generation** - Scratch card sales system
2. **Parent Satisfaction** - Easy result access
3. **Teacher Efficiency** - Streamlined grade entry
4. **Admin Control** - Complete system oversight

## Next Steps (Week 5+):
Once Week 4 validation passes:
1. **Advanced Reporting** - Detailed performance analytics
2. **Communication System** - Automated notifications
3. **Attendance Management** - Complete attendance tracking
4. **Finance Integration** - Fee management with results
5. **Mobile App** - Parent and student mobile access