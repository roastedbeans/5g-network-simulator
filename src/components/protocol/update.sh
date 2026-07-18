#!/bin/bash

set -e

# Configuration
NAMESPACE="hplmn"
DB_NAME="open5gs"
COLLECTION_NAME="subscribers"

# Color codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Check arguments
if [ $# -ne 2 ]; then
    echo "Usage: $0 <IMSI> <NEW_SQN>"
    echo "Example: $0 001010000000001 2000"
    exit 1
fi

IMSI=$1
NEW_SQN=$2

# Validate IMSI
if [[ ! $IMSI =~ ^[0-9]{15}$ ]]; then
    echo -e "${RED}Error: IMSI must be exactly 15 digits${NC}"
    exit 1
fi

# Get MongoDB pod
MONGODB_POD=$(microk8s kubectl get pods -n $NAMESPACE -l app=mongodb -o jsonpath='{.items[0].metadata.name}' 2>/dev/null)
if [ -z "$MONGODB_POD" ]; then
    echo -e "${RED}Error: MongoDB pod not found${NC}"
    exit 1
fi

echo -e "${BLUE}Finding and updating subscriber...${NC}"

# Create MongoDB script
cat > /tmp/update-sqn.js << EOF
db = db.getSiblingDB('$DB_NAME');

// Find subscriber
var subscriber = db.$COLLECTION_NAME.findOne({imsi: "$IMSI"});

if (!subscriber) {
    print("ERROR: Subscriber with IMSI $IMSI not found");
} else {
    print("Found subscriber: " + subscriber.imsi);
    print("Current SQN: " + subscriber.security.sqn);
    
    // Update SQN
    var result = db.$COLLECTION_NAME.updateOne(
        {imsi: "$IMSI"},
        {\$set: {"security.sqn": NumberLong($NEW_SQN)}}
    );
    
    if (result.modifiedCount > 0) {
        print("SUCCESS: SQN updated to $NEW_SQN");
    } else {
        print("ERROR: Failed to update SQN");
    }
}
EOF

# Execute script
microk8s kubectl cp /tmp/update-sqn.js $NAMESPACE/$MONGODB_POD:/tmp/update-sqn.js
microk8s kubectl exec -n $NAMESPACE $MONGODB_POD -- mongo --quiet /tmp/update-sqn.js

# Cleanup
rm -f /tmp/update-sqn.js

echo -e "${GREEN}Done${NC}"
