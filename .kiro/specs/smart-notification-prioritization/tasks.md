# Implementation Plan: Smart Notification Prioritization

## Overview

This implementation plan extends the existing `NotificationService` to support priority-based categorization, intelligent delivery strategies, and notification grouping. The approach maintains backward compatibility while adding new capabilities for priority calculation, multi-channel delivery selection, and intelligent grouping by transfer ID and time windows.

## Tasks

- [x] 1. Create core priority calculation infrastructure
  - [x] 1.1 Create PriorityCalculator class with priority calculation logic
    - Create `backend/src/modules/notifications/priorityCalculator.ts`
    - Implement `PriorityLevel` type and `PriorityMetadata` interface
    - Implement `calculatePriority()` method with rules from design
    - Implement `enrichWithPriority()` method to add priority metadata
    - Implement `getPriorityColor()` helper method
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 7.1, 7.2, 7.3_
  
  - [ ]* 1.2 Write property test for priority calculation rules
    - **Property 1: Priority Calculation Rules**
    - **Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6**
    - Test that fraud_flagged → critical, error+transfer_failed → critical, warning → high, success+transfer_settled → medium, info → low, default → medium
  
  - [ ]* 1.3 Write property test for priority calculation idempotence
    - **Property 2: Priority Calculation Idempotence**
    - **Validates: Requirements 1.8, 10.5**
    - Test that calculating priority multiple times produces the same result
  
  - [ ]* 1.4 Write unit tests for PriorityCalculator edge cases
    - Test notifications with missing metadata
    - Test notifications with unexpected type values
    - Test priority color mapping correctness
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 7.2_

- [ ] 2. Implement delivery strategy selection
  - [-] 2.1 Create DeliveryStrategySelector class
    - Create `backend/src/modules/notifications/deliveryStrategySelector.ts`
    - Implement `DeliveryStrategy` interface
    - Implement `selectStrategy()` method with channel selection rules
    - Implement `buildDeliveries()` method to replace existing logic
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 3.2_
  
  - [ ]* 2.2 Write property test for delivery strategy selection
    - **Property 3: Delivery Strategy Selection**
    - **Validates: Requirements 2.1, 2.2, 2.3, 2.4, 3.2**
    - Test that each priority level maps to correct channels and flags
  
  - [ ]* 2.3 Write property test for channel unavailability handling
    - **Property 4: Channel Unavailability Handling**
    - **Validates: Requirements 2.5**
    - Test that missing email/phone results in skipped delivery with reason
  
  - [ ]* 2.4 Write property test for delivery recording completeness
    - **Property 5: Delivery Recording Completeness**
    - **Validates: Requirements 2.6**
    - Test that deliveries array contains entry for each channel in strategy
  
  - [ ]* 2.5 Write unit tests for DeliveryStrategySelector
    - Test buildDeliveries with various user session states
    - Test channel selection for each priority level
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_

- [ ] 3. Implement notification grouping logic
  - [ ] 3.1 Create NotificationGrouper class
    - Create `backend/src/modules/notifications/notificationGrouper.ts`
    - Implement `NotificationGroup` interface
    - Implement `groupNotifications()` method
    - Implement `groupByTransfer()` private method
    - Implement `groupByTimeWindow()` private method with 5-minute window
    - Implement helper methods: `findTimeWindowMatches()`, `sortByTimestamp()`, `isInTransferGroup()`, `isInTimeWindowGroup()`
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5_
  
  - [ ]* 3.2 Write property test for transfer-based grouping
    - **Property 9: Transfer-Based Grouping**
    - **Validates: Requirements 4.1**
    - Test that 2+ notifications with same transferId are grouped
  
  - [ ]* 3.3 Write property test for group representative selection
    - **Property 10: Group Representative Selection**
    - **Validates: Requirements 4.2**
    - Test that representative is the most recent notification in group
  
  - [ ]* 3.4 Write property test for group notification sorting
    - **Property 11: Group Notification Sorting**
    - **Validates: Requirements 4.3**
    - Test that notifications within group are sorted newest first
  
  - [ ]* 3.5 Write property test for group count accuracy
    - **Property 12: Group Count Accuracy**
    - **Validates: Requirements 4.4, 5.5**
    - Test that count field equals notifications array length
  
  - [ ]* 3.6 Write property test for group unread status
    - **Property 13: Group Unread Status**
    - **Validates: Requirements 4.5**
    - Test that hasUnread is true iff at least one notification is unread
  
  - [ ]* 3.7 Write property test for time-window grouping
    - **Property 14: Time-Window Grouping**
    - **Validates: Requirements 5.1, 5.3**
    - Test that non-critical notifications with same type/priority within 5 minutes are grouped
  
  - [ ]* 3.8 Write property test for critical exclusion from time-window grouping
    - **Property 15: Critical Exclusion from Time-Window Grouping**
    - **Validates: Requirements 5.2**
    - Test that critical notifications never appear in time_window groups
  
  - [ ]* 3.9 Write property test for time-window group separation
    - **Property 16: Time-Window Group Separation**
    - **Validates: Requirements 5.4**
    - Test that notifications >5 minutes apart are not grouped together
  
  - [ ]* 3.10 Write unit tests for NotificationGrouper
    - Test grouping with various notification combinations
    - Test edge cases: single notification, no transferId, mixed priorities
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 5.1, 5.2, 5.3, 5.4, 5.5_

- [~] 4. Checkpoint - Ensure core components pass tests
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Extend NotificationService with priority and grouping
  - [~] 5.1 Add priority and grouping components to NotificationService
    - Import and instantiate `PriorityCalculator`, `DeliveryStrategySelector`, `NotificationGrouper` in NotificationService
    - Add `UnreadCounts` and `EnrichedNotificationList` interfaces to notificationService.ts
    - _Requirements: 1.7, 6.1, 6.2, 6.3, 6.4, 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [~] 5.2 Implement listByUserIdEnriched method
    - Add `listByUserIdEnriched()` method to NotificationService
    - Implement priority enrichment for all notifications
    - Implement notification sorting by priority then timestamp
    - Implement group sorting by representative priority and timestamp
    - Implement unread counts calculation per priority level
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [~] 5.3 Implement priority-based sorting methods
    - Add `sortByPriorityAndTimestamp()` private method
    - Add `sortGroupsByPriorityAndTimestamp()` private method
    - Add `calculateUnreadCounts()` private method
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 8.1, 8.2, 8.3, 8.4, 8.5_
  
  - [ ]* 5.4 Write property test for notification list priority sorting
    - **Property 17: Notification List Priority Sorting**
    - **Validates: Requirements 6.1, 6.2**
    - Test that notifications are sorted by priority then timestamp
  
  - [ ]* 5.5 Write property test for group priority sorting
    - **Property 18: Group Priority Sorting**
    - **Validates: Requirements 6.3**
    - Test that groups are sorted by representative priority and timestamp
  
  - [ ]* 5.6 Write property test for sort order preservation on addition
    - **Property 19: Sort Order Preservation on Addition**
    - **Validates: Requirements 6.4**
    - Test that adding new notification maintains sort order
  
  - [ ]* 5.7 Write property test for unread counts accuracy
    - **Property 7: Unread Counts Accuracy**
    - **Validates: Requirements 3.4, 8.1, 8.2, 8.3, 8.4, 8.5**
    - Test that unread counts accurately reflect unread notifications per priority
  
  - [ ]* 5.8 Write property test for unread count update on mark as read
    - **Property 8: Unread Count Update on Mark as Read**
    - **Validates: Requirements 8.6**
    - Test that marking as read decreases priority-level count by 1

- [ ] 6. Modify notification creation to use priority-based delivery
  - [~] 6.1 Update createForUser method to use DeliveryStrategySelector
    - Modify `createForUser()` to calculate priority before creating notification
    - Use `DeliveryStrategySelector.selectStrategy()` to determine channels
    - Use `DeliveryStrategySelector.buildDeliveries()` to build delivery records
    - Update event payload to include priority field
    - _Requirements: 1.1, 1.7, 2.1, 2.2, 2.3, 2.4, 2.5, 2.6_
  
  - [~] 6.2 Implement sendPushNotificationWithPriority method
    - Add `sendPushNotificationWithPriority()` private method
    - Include priority and isCritical in push notification data payload
    - Replace existing `sendPushNotification()` call with new method
    - _Requirements: 3.1, 7.5_
  
  - [ ]* 6.3 Write property test for critical notification visual indicators
    - **Property 6: Critical Notification Visual Indicators**
    - **Validates: Requirements 3.3**
    - Test that critical notifications have isCritical=true and priorityColor='red'
  
  - [ ]* 6.4 Write property test for priority metadata enrichment
    - **Property 20: Priority Metadata Enrichment**
    - **Validates: Requirements 7.1, 7.2, 7.3**
    - Test that enrichment adds priority, priorityColor, and isCritical fields
  
  - [ ]* 6.5 Write property test for priority preservation on mark as read
    - **Property 21: Priority Preservation on Mark as Read**
    - **Validates: Requirements 7.4**
    - Test that priority fields remain unchanged after marking as read
  
  - [ ]* 6.6 Write property test for push notification priority metadata
    - **Property 22: Push Notification Priority Metadata**
    - **Validates: Requirements 7.5**
    - Test that push data includes priority and isCritical fields

- [ ] 7. Ensure backward compatibility
  - [~] 7.1 Verify existing notification methods work unchanged
    - Test that `notifyTransferSettled()` continues to work
    - Test that `notifyTransferFailed()` continues to work
    - Test that `notifyFraudFlagged()` continues to work
    - Test that existing `listByUserId()` method continues to work
    - Test that `markAsRead()` continues to work
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [ ]* 7.2 Write property test for backward compatibility response structure
    - **Property 23: Backward Compatibility Response Structure**
    - **Validates: Requirements 9.5**
    - Test that enriched notifications contain all existing fields plus priority fields
  
  - [ ]* 7.3 Write integration tests for backward compatibility
    - Test that existing notifications without priority field are handled correctly
    - Test that all existing notification types are supported
    - Test that all existing channels are supported
    - Test that existing metadata structure is preserved
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [ ] 8. Add performance validation
  - [ ]* 8.1 Write performance tests for priority calculation
    - Test that priority calculation completes in <10ms
    - _Requirements: 10.1_
  
  - [ ]* 8.2 Write performance tests for grouping
    - Test that grouping 1000 notifications completes in <50ms
    - _Requirements: 10.2_
  
  - [ ]* 8.3 Write performance tests for sorting
    - Test that sorting 1000 notifications by priority completes in <50ms
    - _Requirements: 10.3_

- [ ] 9. Update API routes and exports
  - [~] 9.1 Export new types and interfaces
    - Export `PriorityLevel`, `PriorityMetadata`, `NotificationGroup`, `UnreadCounts`, `EnrichedNotificationList` from notificationService.ts
    - Export `DeliveryStrategy` from deliveryStrategySelector.ts
    - _Requirements: 7.1, 7.2, 7.3_
  
  - [~] 9.2 Add API endpoint for enriched notification list
    - Add route handler for enriched notification list (if needed)
    - Ensure existing routes continue to work
    - _Requirements: 9.5_

- [~] 10. Final checkpoint - Integration validation
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- The implementation maintains backward compatibility by keeping existing methods unchanged
- Priority is calculated at runtime rather than stored, ensuring consistency
- Grouping is performed during retrieval to avoid storage complexity
- Critical notifications bypass rate limiting and are delivered immediately through all channels
- Time-window grouping uses a 5-minute window and excludes critical notifications
- All property tests validate universal correctness properties from the design document
- Performance requirements ensure sub-50ms response times for lists up to 1000 notifications

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "2.1", "3.1"] },
    { "id": 1, "tasks": ["1.2", "1.3", "1.4", "2.2", "2.3", "2.4", "2.5", "3.2", "3.3", "3.4", "3.5", "3.6", "3.7", "3.8", "3.9", "3.10"] },
    { "id": 2, "tasks": ["5.1"] },
    { "id": 3, "tasks": ["5.2", "5.3"] },
    { "id": 4, "tasks": ["5.4", "5.5", "5.6", "5.7", "5.8", "6.1"] },
    { "id": 5, "tasks": ["6.2"] },
    { "id": 6, "tasks": ["6.3", "6.4", "6.5", "6.6", "7.1"] },
    { "id": 7, "tasks": ["7.2", "7.3", "8.1", "8.2", "8.3", "9.1"] },
    { "id": 8, "tasks": ["9.2"] }
  ]
}
```
