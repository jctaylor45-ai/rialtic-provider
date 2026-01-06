#!/bin/bash

echo "🔍 Testing Provider Portal Application..."
echo ""

# Test if server is running
echo "1. Testing server status..."
if curl -s http://localhost:3000 > /dev/null; then
    echo "   ✅ Server is running"
else
    echo "   ❌ Server is not responding"
    exit 1
fi

# Test data endpoints
echo ""
echo "2. Testing data endpoints..."

if curl -s http://localhost:3000/data/claims.json | jq -e '.[] | select(.id == "CLM-2025-1001")' > /dev/null 2>&1; then
    echo "   ✅ claims.json is accessible and valid"
else
    echo "   ❌ claims.json has issues"
fi

if curl -s http://localhost:3000/data/policies.json | jq -e '.[] | select(.id == "POL-001")' > /dev/null 2>&1; then
    echo "   ✅ policies.json is accessible and valid"
else
    echo "   ❌ policies.json has issues"
fi

if curl -s http://localhost:3000/data/insights.json | jq -e '.[] | select(.id == "INS-001")' > /dev/null 2>&1; then
    echo "   ✅ insights.json is accessible and valid"
else
    echo "   ❌ insights.json has issues"
fi

# Test routes
echo ""
echo "3. Testing routes..."

routes=("/" "/policies" "/claims" "/insights" "/claim-lab" "/impact")

for route in "${routes[@]}"; do
    if curl -s "http://localhost:3000${route}" | grep -q "__NUXT__"; then
        echo "   ✅ ${route} loads successfully"
    else
        echo "   ❌ ${route} failed to load"
    fi
done

echo ""
echo "✅ All tests completed!"
