#!/bin/bash
# backend/scripts/test-week5.sh

echo "🧪 Testing Week 5 - Advanced Reporting & Analytics System"

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

# Get test data
echo -e "\n${YELLOW}Getting test data...${NC}"
STUDENTS_RESPONSE=$(curl -s -X GET "$API_URL/students" \
  -H "Authorization: Bearer $TOKEN")
STUDENT_ID=$(echo $STUDENTS_RESPONSE | jq -r '.data.students[0].id // empty')

CLASSES_RESPONSE=$(curl -s -X GET "$API_URL/academics/classes" \
  -H "Authorization: Bearer $TOKEN")
CLASS_ID=$(echo $CLASSES_RESPONSE | jq -r '.data.classes[0].id // empty')

SUBJECTS_RESPONSE=$(curl -s -X GET "$API_URL/academics/subjects" \
  -H "Authorization: Bearer $TOKEN")
SUBJECT_ID=$(echo $SUBJECTS_RESPONSE | jq -r '.data.subjects[0].id // empty')

# Get current term (assuming first term is current)
TERMS_RESPONSE=$(curl -s -X GET "$API_URL/academics/terms" 2>/dev/null || echo '{"data":{"terms":[]}}')
TERM_ID=$(echo $TERMS_RESPONSE | jq -r '.data.terms[0].id // empty' 2>/dev/null)

echo "Student ID: ${STUDENT_ID:-'Not found'}"
echo "Class ID: ${CLASS_ID:-'Not found'}"
echo "Subject ID: ${SUBJECT_ID:-'Not found'}"
echo "Term ID: ${TERM_ID:-'Not found'}"

# Test Analytics Dashboard
echo -e "\n${YELLOW}=== Testing Analytics Dashboard ===${NC}"

echo -e "\n${YELLOW}Getting school dashboard analytics...${NC}"
curl -s -X GET "$API_URL/analytics/dashboard" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.overview // "No data"'

# Test class analytics if we have class and term
if [ -n "$CLASS_ID" ] && [ -n "$TERM_ID" ]; then
  echo -e "\n${YELLOW}Getting class analytics...${NC}"
  curl -s -X GET "$API_URL/analytics/class/$CLASS_ID/term/$TERM_ID" \
    -H "Authorization: Bearer $TOKEN" | jq '.data.statistics // "No data"'
fi

# Test subject analytics if we have subject and term
if [ -n "$SUBJECT_ID" ] && [ -n "$TERM_ID" ]; then
  echo -e "\n${YELLOW}Getting subject analytics...${NC}"
  curl -s -X GET "$API_URL/analytics/subject/$SUBJECT_ID/term/$TERM_ID" \
    -H "Authorization: Bearer $TOKEN" | jq '.data.statistics // "No data"'
fi

# Test Report System
echo -e "\n${YELLOW}=== Testing Report System ===${NC}"

# Get report templates
echo -e "\n${YELLOW}Getting report templates...${NC}"
curl -s -X GET "$API_URL/reports/templates" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.templates | length // 0'

# Create a report template
echo -e "\n${YELLOW}Creating report template...${NC}"
TEMPLATE_RESPONSE=$(curl -s -X POST "$API_URL/reports/templates" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Standard Student Report",
    "type": "student_report",
    "description": "Standard student performance report",
    "outputFormat": "pdf"
  }')

echo $TEMPLATE_RESPONSE | jq '.message // .error // "No response"'

# Generate student report if we have student and term
if [ -n "$STUDENT_ID" ] && [ -n "$TERM_ID" ]; then
  echo -e "\n${YELLOW}Generating student report...${NC}"
  REPORT_RESPONSE=$(curl -s -X POST "$API_URL/reports/generate/student" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "studentId": "'$STUDENT_ID'",
      "termId": "'$TERM_ID'"
    }')
  
  echo $REPORT_RESPONSE | jq '.message // .error // "No response"'
  REPORT_ID=$(echo $REPORT_RESPONSE | jq -r '.data.reportId // empty')
  
  # Check report status
  if [ -n "$REPORT_ID" ]; then
    echo -e "\n${YELLOW}Checking report status...${NC}"
    sleep 2 # Give it time to generate
    curl -s -X GET "$API_URL/reports/$REPORT_ID/status" \
      -H "Authorization: Bearer $TOKEN" | jq '.data.status // "Unknown"'
  fi
fi

# Generate class report if we have class and term
if [ -n "$CLASS_ID" ] && [ -n "$TERM_ID" ]; then
  echo -e "\n${YELLOW}Generating class report...${NC}"
  CLASS_REPORT_RESPONSE=$(curl -s -X POST "$API_URL/reports/generate/class" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "classId": "'$CLASS_ID'",
      "termId": "'$TERM_ID'"
    }')
  
  echo $CLASS_REPORT_RESPONSE | jq '.message // .error // "No response"'
fi

# Get user's reports
echo -e "\n${YELLOW}Getting my generated reports...${NC}"
curl -s -X GET "$API_URL/reports/my-reports" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.reports | length // 0'

echo -e "\n${GREEN}Week 5 testing completed!${NC}"

# Week 5 Package.json updates
echo '{
  "dependencies": {
    "pdfkit": "^0.13.0",
    "xlsx": "^0.18.5",
    "chart.js": "^4.4.0",
    "canvas": "^2.11.2"
  }
}' > /tmp/week5_deps.json

echo "Additional dependencies for Week 5:"
cat /tmp/week5_deps.json

