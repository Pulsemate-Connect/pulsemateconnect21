# Clinic Schedule & Timings - Test Suite

## 📋 Overview

Automated test suite with **20 comprehensive test conditions** for the Clinic Schedule & Timings system.

## 🧪 Test Coverage

### Working Hours Tests (3 tests)
1. ✅ Create working hours for all 7 days
2. ✅ Get/retrieve working hours
3. ✅ Copy Monday schedule to other days

### Breaks Tests (4 tests)
4. ✅ Create lunch break
5. ✅ Create tea break  
6. ✅ Get all breaks
7. ✅ Update break details

### Holidays Tests (4 tests)
8. ✅ Create public holiday
9. ✅ Create clinic holiday
10. ✅ Get holidays with date range filter
11. ✅ Update holiday details

### Special Hours Tests (3 tests)
12. ✅ Create special hours for specific date
13. ✅ Create special hours marked as closed
14. ✅ Get all special hours

### Temporary Closure Tests (3 tests)
15. ✅ Create temporary closure
16. ✅ Get temporary closure status
17. ✅ Verify clinic status shows as closed

### Reopen & Status Tests (3 tests)
18. ✅ Reopen clinic after closure
19. ✅ Verify clinic status after reopening
20. ✅ Get today's schedule with stats

## 🚀 How to Run Tests

### Prerequisites

1. **Backend server must be running:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Database must be set up with schedule tables:**
   - Run `create_schedule_tables.sql`
   - OR `npx prisma db push`

### Run the Tests

#### Windows:
```bash
cd backend/tests/schedule
run-schedule-tests.bat
```

#### Linux/Mac:
```bash
cd backend/tests/schedule
node clinic-schedule.test.js
```

## 📊 Test Output

The test suite provides colored console output:

- ✅ **Green** - Passed tests
- ❌ **Red** - Failed tests
- ℹ️ **Blue** - Info messages
- ⚠️ **Yellow** - Warnings

### Sample Output:

```
========================================
🧪 CLINIC SCHEDULE AUTOMATED TEST SUITE
========================================

ℹ Setting up test environment...
ℹ Created test user: abc-123
ℹ Created test clinic: xyz-789
✓ Test environment ready

[Test 1/20] Create Working Hours for All Days
✓ Working hours created for 7 days

[Test 2/20] Get Working Hours
✓ Retrieved 7 working hours entries

[Test 3/20] Copy Monday Schedule to Other Days
✓ Copied Monday schedule to 4 days

...

========================================
📊 TEST RESULTS
========================================
✓ Passed: 20/20
✗ Failed: 0/20
Success Rate: 100.0%
========================================
```

## 🔧 Test Data

The test suite automatically:

1. **Creates:**
   - Test clinic owner user
   - Test clinic
   - Working hours for all days
   - 2 breaks (lunch and tea)
   - 2 holidays (Independence Day, Christmas)
   - 2 special hours entries
   - 1 temporary closure

2. **Tests CRUD operations:**
   - Create
   - Read/Get
   - Update
   - Delete (implicit via cleanup)

3. **Cleans up:**
   - All test data is deleted after tests complete
   - No residual data left in database

## 📝 Test Details

### Test 1: Create Working Hours
- Creates weekly schedule for all 7 days
- Monday-Friday: Morning 9-1, Evening 4-8
- Wednesday: Morning only
- Saturday: Morning 9-2
- Sunday: Closed

### Test 2: Get Working Hours
- Retrieves all working hours
- Verifies array response

### Test 3: Copy Monday
- Copies Monday schedule to Tue-Fri
- Verifies update count

### Test 4: Create Lunch Break
- Creates break from 1 PM to 4 PM
- Applicable: Mon-Sat

### Test 5: Create Tea Break
- Creates break from 11 AM to 11:15 AM
- Applicable: Mon-Fri

### Test 6: Get All Breaks
- Retrieves all breaks
- Verifies minimum 2 breaks exist

### Test 7: Update Break
- Updates lunch break timing
- Changes to 1:30 PM - 4:30 PM

### Test 8: Create Public Holiday
- Independence Day (Aug 15)
- Type: PUBLIC_HOLIDAY
- Recurring: Yes

### Test 9: Create Clinic Holiday
- Christmas (Dec 25)
- Type: CLINIC_HOLIDAY
- Recurring: Yes

### Test 10: Get Holidays
- Fetches holidays in date range
- 2026-01-01 to 2026-12-31

### Test 11: Update Holiday
- Updates Independence Day details
- Changes name and reason

### Test 12: Create Special Hours
- New Year's Eve extended hours
- Morning 8 AM - 2 PM only

### Test 13: Create Special Closed
- Gandhi Jayanti
- Marked as closed

### Test 14: Get Special Hours
- Retrieves all special hours
- Date range filter

### Test 15: Create Temporary Closure
- Emergency maintenance
- Active status

### Test 16: Get Closure Status
- Retrieves active closure
- Verifies isActive = true

### Test 17: Check Clinic Status (Closed)
- Status should show closed
- Temporary closure active

### Test 18: Reopen Clinic
- Ends temporary closure
- Reactivates clinic

### Test 19: Check Clinic Status (Open)
- Status should reflect changes
- No active closure

### Test 20: Get Today's Schedule
- Full schedule for current day
- Statistics included

## 🐛 Troubleshooting

### Test Fails: "Backend server not running"
**Solution:** Start backend with `npm run dev`

### Test Fails: "Table does not exist"
**Solution:** Run `create_schedule_tables.sql` or `npx prisma db push`

### Test Fails: "Authentication error"
**Solution:** The test uses mock authentication. Update `authToken` logic if your API requires real JWT tokens.

### Test Fails: "Foreign key constraint"
**Solution:** Ensure all schedule tables are properly created with correct foreign key relationships.

## 🔄 Continuous Integration

To run these tests in CI/CD:

```yaml
# .github/workflows/test.yml
- name: Run Schedule Tests
  run: |
    cd backend
    npm run dev &
    sleep 5
    cd tests/schedule
    node clinic-schedule.test.js
```

## 📈 Adding More Tests

To add new test conditions:

1. Add a new test block following the same structure
2. Update test count in comments and output
3. Document the test in this README

### Template:

```javascript
// ============================================================
// TEST XX: Test Name
// ============================================================
log.test(XX, 'Test Description');
try {
  const result = await apiRequest('METHOD', '/endpoint', data);
  
  if (result.success && /* validation */) {
    log.success('Success message');
    passedTests++;
  } else {
    throw new Error('Error message');
  }
} catch (error) {
  log.error(`Failed: ${error.message}`);
  failedTests++;
}
```

## 📚 Related Documentation

- `SETUP_CLINIC_SCHEDULE.md` - Setup instructions
- `CLINIC_SCHEDULE_COMPLETE.md` - Feature documentation
- `IMPLEMENTATION_SUMMARY.md` - Implementation overview

## ✅ Test Checklist

Before running tests, ensure:

- [ ] Backend server is running on port 5000
- [ ] Database tables are created
- [ ] Environment variables are set
- [ ] Prisma client is generated (`npx prisma generate`)
- [ ] No other test data conflicts

## 🎯 Success Criteria

Tests are considered passing when:
- All 20 tests execute without errors
- Success rate is 100%
- No residual test data remains
- No database constraint violations

---

**Last Updated:** August 17, 2026  
**Test Suite Version:** 1.0  
**Coverage:** 20 test conditions  
**Status:** ✅ Ready to Run
