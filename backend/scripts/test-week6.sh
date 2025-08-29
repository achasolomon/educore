// backend/scripts/test-week6.sh
#!/bin/bash

echo "🧪 Testing Week 6 - Communication & Notification System"

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

# Test Communication System
echo -e "\n${YELLOW}=== Testing Communication System ===${NC}"

# Get conversations
echo -e "\n${YELLOW}Getting conversations...${NC}"
curl -s -X GET "$API_URL/communication/conversations" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.conversations | length // 0'

# Create a conversation
echo -e "\n${YELLOW}Creating conversation...${NC}"
CONVERSATION_RESPONSE=$(curl -s -X POST "$API_URL/communication/conversations" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Discussion",
    "type": "group",
    "participants": []
  }')

echo $CONVERSATION_RESPONSE | jq '.message // .error // "No response"'

# Get user inbox
echo -e "\n${YELLOW}Getting inbox...${NC}"
curl -s -X GET "$API_URL/communication/inbox" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.messages | length // 0'

# Test Announcements
echo -e "\n${YELLOW}=== Testing Announcements ===${NC}"

# Get announcements
echo -e "\n${YELLOW}Getting announcements...${NC}"
curl -s -X GET "$API_URL/communication/announcements" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.announcements | length // 0'

# Create announcement
echo -e "\n${YELLOW}Creating announcement...${NC}"
ANNOUNCEMENT_RESPONSE=$(curl -s -X POST "$API_URL/communication/announcements" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Announcement",
    "content": "This is a test announcement for system validation.",
    "type": "general",
    "priority": "normal",
    "targetAudience": {
      "roles": ["parent", "teacher"]
    }
  }')

echo $ANNOUNCEMENT_RESPONSE | jq '.message // .error // "No response"'
ANNOUNCEMENT_ID=$(echo $ANNOUNCEMENT_RESPONSE | jq -r '.data.announcement.id // empty')

# Test Notifications
echo -e "\n${YELLOW}=== Testing Notifications ===${NC}"

# Get notification templates
echo -e "\n${YELLOW}Getting notification templates...${NC}"
curl -s -X GET "$API_URL/communication/notification-templates" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.templates | length // 0'

# Get user notifications
echo -e "\n${YELLOW}Getting user notifications...${NC}"
curl -s -X GET "$API_URL/communication/notifications" \
  -H "Authorization: Bearer $TOKEN" | jq '.data.notifications | length // 0'

echo -e "\n${GREEN}Week 6 testing completed!${NC}"