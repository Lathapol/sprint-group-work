# UAT Report

**Test Evidence:** [https://docs.google.com/document/d/15YZejPw8yIwcs4R5TKNnu7FhPABnV89XdWPvdhN5TMg/edit?tab=t.0#heading=h.8y5fey5hd4yf](https://docs.google.com/document/d/15YZejPw8yIwcs4R5TKNnu7FhPABnV89XdWPvdhN5TMg/edit?tab=t.0#heading=h.8y5fey5hd4yf)

**Overall: PASS with one low-priority finding.**

Five scenarios passed without issues. One scenario (UAT6-03) identified a difference between the documented and actual HTTP response status.

## Test Results Summary

| Test ID | Test Area                                         | Result     |
| ------- | ------------------------------------------------- | ---------- |
| UAT6-01 | Normal approval journey                           | PASS       |
| UAT6-02 | Submission boundaries and read-only data          | PASS       |
| UAT6-03 | Cross-requester ownership and forbidden review    | FAIL (Low) |
| UAT6-04 | Rejection reason and requester retrieval          | PASS       |
| UAT6-05 | Assigned reviewer and terminal-state restrictions | PASS       |
| UAT6-06 | Authentication and logout boundary                | PASS       |

## Defect Report

### UAT6-03 – HTTP Status Code Mismatch

- **Severity:** Low
- **Expected:** HTTP 403 (Forbidden)
- **Actual:** HTTP 404 (Not Found)
- **Impact:** No unauthorized access or private data disclosure occurred. The access restriction remained enforced.

**Finding:**

The API returned HTTP 404 instead of the expected HTTP 403 when requester2 attempted to claim another request.

**Recommendation:**

Review the expected HTTP status code in the UAT documentation. A 404 response may be intentional to avoid revealing whether a protected resource exists. If this is the intended security behavior, update the expected result accordingly.

**Disposition:**

The finding is classified as low priority because the security restriction worked as intended. No unauthorized modification or disclosure was observed. The Product Team should confirm whether the implementation or documentation requires correction.

## Conclusion

The product successfully passed five out of six UAT scenarios. Core functionalit behaved as expected.

The only finding concerns an HTTP status code mismatch rather than a failure of access control.
