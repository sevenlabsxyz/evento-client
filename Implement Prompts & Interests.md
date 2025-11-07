# Prompts & Interests API Documentation

This document provides comprehensive documentation for the Prompts and Interests features in the Evento platform. These features allow users to express their personality and preferences through profile prompts and interest tags.

## Table of Contents

1. [Overview](#overview)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
4. [Implementation Flows](#implementation-flows)
5. [Error Handling](#error-handling)

---

## Overview

### Interests

Interests are hierarchical tags that users can select to indicate their hobbies, preferences, and areas of interest. They support:

- **Parent-child relationships** (e.g., "Sports" → "Basketball")
- **Unlimited user selections** (no maximum limit)
- **Active/inactive state management**
- **User search and discovery** based on shared interests

### Prompts

Prompts are conversation starters that users answer to showcase their personality. They support:

- **Maximum 4 prompts per user**
- **Display ordering** (1-4) for custom arrangement
- **Visibility toggle** (show/hide on profile)
- **Category-based organization**
- **Answer length validation** (5-500 characters)

---

## Database Schema

### Tables

#### `interests`

Master list of all available interests.

| Column               | Type        | Description                                      |
| -------------------- | ----------- | ------------------------------------------------ |
| `id`                 | uuid        | Primary key                                      |
| `name`               | text        | Display name of the interest                     |
| `slug`               | text        | URL-friendly identifier                          |
| `description`        | text        | Optional description                             |
| `parent_interest_id` | uuid        | References parent interest (null for top-level)  |
| `is_active`          | bool        | Whether this interest is available for selection |
| `created_at`         | timestamptz | Creation timestamp                               |
| `updated_at`         | timestamptz | Last update timestamp                            |

**Constraints:**

- Self-referential foreign key to support hierarchy

#### `user_interests`

Junction table linking users to their selected interests.

| Column        | Type        | Description                    |
| ------------- | ----------- | ------------------------------ |
| `id`          | uuid        | Primary key                    |
| `user_id`     | uuid        | References user_details.id     |
| `interest_id` | uuid        | References interests.id        |
| `created_at`  | timestamptz | When the interest was selected |

**Constraints:**

- Unique constraint on `(user_id, interest_id)` - prevents duplicates

#### `prompts`

Master list of all available prompts.

| Column             | Type        | Description                                     |
| ------------------ | ----------- | ----------------------------------------------- |
| `id`               | uuid        | Primary key                                     |
| `question`         | text        | The prompt question                             |
| `category`         | text        | Grouping category (e.g., "personal", "general") |
| `placeholder_text` | text        | Suggested answer format                         |
| `is_active`        | bool        | Whether this prompt is available                |
| `created_at`       | timestamptz | Creation timestamp                              |
| `updated_at`       | timestamptz | Last update timestamp                           |

#### `user_prompts`

Stores user answers to prompts.

| Column          | Type        | Description                       |
| --------------- | ----------- | --------------------------------- |
| `id`            | uuid        | Primary key                       |
| `user_id`       | uuid        | References user_details.id        |
| `prompt_id`     | uuid        | References prompts.id             |
| `answer`        | text        | User's answer (sanitized HTML)    |
| `display_order` | int4        | Order position (1-4)              |
| `is_visible`    | bool        | Whether to show on public profile |
| `updated_at`    | timestamptz | Last update timestamp             |

**Constraints:**

- Unique constraint on `(user_id, prompt_id)` - one answer per prompt per user
- Unique constraint on `(user_id, display_order)` - no duplicate positions

---

## API Endpoints

### Base URL

All endpoints are prefixed with: `/api/v1`

---

## Interests Endpoints

### 1. Get All Available Interests

**Endpoint:** `GET /interests`

**Authentication:** Not required

**Query Parameters:**

| Parameter          | Type    | Default | Description                    |
| ------------------ | ------- | ------- | ------------------------------ |
| `include_children` | boolean | `true`  | Include hierarchical structure |
| `parent_only`      | boolean | `false` | Return only parent interests   |

**Response:**

```json
{
    "success": true,
    "message": "Interests fetched successfully",
    "data": [
        {
            "id": "uuid",
            "name": "Sports",
            "slug": "sports",
            "description": "Athletic activities and games",
            "parent_interest_id": null,
            "is_active": true,
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-01-01T00:00:00Z",
            "children": [
                {
                    "id": "uuid",
                    "name": "Basketball",
                    "slug": "basketball",
                    "description": "Playing or watching basketball",
                    "parent_interest_id": "parent-uuid",
                    "is_active": true,
                    "created_at": "2024-01-01T00:00:00Z",
                    "updated_at": "2024-01-01T00:00:00Z"
                }
            ]
        }
    ]
}
```

**Example Usage:**

```javascript
// Get all interests with hierarchy
const response = await fetch('/api/v1/interests');
const { data } = await response.json();

// Get only parent interests (for category display)
const parents = await fetch('/api/v1/interests?parent_only=true');

// Get flat list without hierarchy
const flat = await fetch('/api/v1/interests?include_children=false');
```

---

### 2. Get User's Own Interests

**Endpoint:** `GET /user/interests`

**Authentication:** Required

**Description:** Returns the authenticated user's selected interests.

**Response:**

```json
{
    "success": true,
    "message": "User interests fetched successfully",
    "data": [
        {
            "id": "interest-uuid",
            "name": "Basketball",
            "slug": "basketball",
            "description": "Playing or watching basketball",
            "parent_interest": {
                "id": "parent-uuid",
                "name": "Sports",
                "slug": "sports"
            },
            "selected_at": "2024-01-15T10:30:00Z"
        }
    ]
}
```

**Sorting:** Results are sorted by parent name, then child name.

---

### 3. Get Another User's Interests

**Endpoint:** `GET /users/{userId}/interests`

**Authentication:** Not required

**Path Parameters:**

| Parameter | Type | Description      |
| --------- | ---- | ---------------- |
| `userId`  | uuid | Target user's ID |

**Response:** Same format as endpoint #2

**Error Cases:**

- `404` if user doesn't exist

---

### 4. Add Interests to User Profile

**Endpoint:** `POST /user/interests`

**Authentication:** Required

**Request Body:**

```json
{
    "interest_ids": ["uuid1", "uuid2", "uuid3"]
}
```

**Validation:**

- `interest_ids` must be a non-empty array
- All IDs must reference active interests
- Duplicate interests are skipped (idempotent)

**Response:**

```json
{
    "success": true,
    "message": "Interests processed successfully",
    "data": {
        "added_interests": [
            {
                "id": "uuid",
                "name": "Basketball",
                "slug": "basketball",
                "parent_interest": {
                    "id": "parent-uuid",
                    "name": "Sports",
                    "slug": "sports"
                }
            }
        ],
        "skipped_interests": [
            {
                "id": "uuid2",
                "reason": "already_exists"
            }
        ],
        "total_user_interests": 5
    }
}
```

---

### 5. Replace All User Interests

**Endpoint:** `PUT /user/interests`

**Authentication:** Required

**Description:** Atomically replaces all user interests. Supports rollback on failure.

**Request Body:**

```json
{
    "interest_ids": ["uuid1", "uuid2"]
}
```

**Validation:**

- `interest_ids` must be an array (can be empty to remove all)
- All IDs must reference active interests

**Response:**

```json
{
    "success": true,
    "message": "Interests updated successfully",
    "data": [
        {
            "id": "uuid",
            "name": "Basketball",
            "slug": "basketball",
            "description": "Playing or watching basketball",
            "parent_interest": {
                "id": "parent-uuid",
                "name": "Sports",
                "slug": "sports"
            },
            "selected_at": "2024-01-15T10:30:00Z"
        }
    ]
}
```

**Error Handling:**

- Automatic rollback to previous state on failure
- Returns `UPDATE_FAILED` error code if rollback occurs

---

### 6. Remove Single Interest

**Endpoint:** `DELETE /user/interests/{interestId}`

**Authentication:** Required

**Path Parameters:**

| Parameter    | Type | Description        |
| ------------ | ---- | ------------------ |
| `interestId` | uuid | Interest to remove |

**Response:**

```json
{
    "success": true,
    "message": "Interest removed successfully",
    "data": {
        "removed_interest_id": "uuid",
        "remaining_interests_count": 4
    }
}
```

**Error Cases:**

- `404` if interest not found in user's interests

---

## Prompts Endpoints

### 1. Get All Available Prompts

**Endpoint:** `GET /prompts`

**Authentication:** Not required

**Query Parameters:**

| Parameter        | Type    | Default | Description                      |
| ---------------- | ------- | ------- | -------------------------------- |
| `category`       | string  | (all)   | Filter by category               |
| `user_id`        | uuid    | -       | User ID for filtering            |
| `available_only` | boolean | `false` | Exclude already answered prompts |

**Response:**

```json
{
    "success": true,
    "message": "Prompts fetched successfully",
    "data": [
        {
            "id": "uuid",
            "question": "What's your perfect Sunday?",
            "category": "personal",
            "placeholder_text": "Describe your ideal relaxing day",
            "sort_order": 1,
            "is_active": true,
            "created_at": "2024-01-01T00:00:00Z",
            "updated_at": "2024-01-01T00:00:00Z"
        }
    ]
}
```

**Example Usage:**

```javascript
// Get all active prompts
const all = await fetch('/api/v1/prompts');

// Get prompts by category
const personal = await fetch('/api/v1/prompts?category=personal');

// Get available prompts for user (excluding answered ones)
const available = await fetch('/api/v1/prompts?user_id=uuid&available_only=true');
```

---

### 2. Get User's Own Prompts

**Endpoint:** `GET /user/prompts`

**Authentication:** Required

**Description:** Returns the authenticated user's prompt answers, including hidden prompts.

**Response:**

```json
{
    "success": true,
    "message": "User prompts fetched successfully",
    "data": [
        {
            "id": "user-prompt-uuid",
            "prompt": {
                "id": "prompt-uuid",
                "question": "What's your perfect Sunday?",
                "category": "personal"
            },
            "answer": "Coffee, brunch with friends, and a long walk in the park",
            "display_order": 1,
            "is_visible": true,
            "answered_at": "2024-01-15T10:30:00Z",
            "updated_at": "2024-01-15T10:30:00Z"
        }
    ]
}
```

**Sorting:** Results are ordered by `display_order` (ascending).

---

### 3. Get Another User's Prompts

**Endpoint:** `GET /users/{userId}/prompts`

**Authentication:** Not required

**Path Parameters:**

| Parameter | Type | Description      |
| --------- | ---- | ---------------- |
| `userId`  | uuid | Target user's ID |

**Description:** Returns only visible prompts for public viewing.

**Response:** Same format as endpoint #2, but only includes `is_visible: true` prompts.

**Error Cases:**

- `404` if user doesn't exist

---

### 4. Answer a Prompt

**Endpoint:** `POST /user/prompts`

**Authentication:** Required

**Request Body:**

```json
{
    "prompt_id": "uuid",
    "answer": "My answer to this prompt",
    "display_order": 1
}
```

**Validation:**

- `prompt_id` required and must be active
- `answer` required, 5-500 characters after sanitization
- `display_order` optional (1-4), auto-assigned if not provided
- Maximum 4 prompts per user
- Cannot answer same prompt twice

**Response:**

```json
{
    "success": true,
    "message": "Prompt answered successfully",
    "data": {
        "id": "user-prompt-uuid",
        "prompt": {
            "id": "prompt-uuid",
            "question": "What's your perfect Sunday?",
            "category": "personal"
        },
        "answer": "Coffee, brunch with friends, and a long walk in the park",
        "display_order": 1,
        "is_visible": true,
        "answered_at": "2024-01-15T10:30:00Z"
    }
}
```

**Error Codes:**

- `DUPLICATE_PROMPT` - Already answered this prompt
- `PROMPT_LIMIT_EXCEEDED` - Already have 4 prompts
- `INVALID_DISPLAY_ORDER` - Display order not available or out of range (1-4)

**Auto-Assignment Logic:**
If `display_order` is not provided, the system tries positions 1-4 sequentially until finding an available slot.

---

### 5. Update a Prompt Answer

**Endpoint:** `PATCH /user/prompts/{userPromptId}`

**Authentication:** Required

**Path Parameters:**

| Parameter      | Type | Description                   |
| -------------- | ---- | ----------------------------- |
| `userPromptId` | uuid | The user_prompts.id to update |

**Request Body:**

```json
{
    "answer": "Updated answer",
    "display_order": 2,
    "is_visible": false
}
```

**Notes:**

- All fields are optional
- Can update any combination of fields
- Same validation rules apply as POST

**Response:**

```json
{
    "success": true,
    "message": "Prompt updated successfully",
    "data": {
        "id": "user-prompt-uuid",
        "prompt": {
            "id": "prompt-uuid",
            "question": "What's your perfect Sunday?",
            "category": "personal"
        },
        "answer": "Updated answer",
        "display_order": 2,
        "is_visible": false,
        "answered_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-15T15:45:00Z"
    }
}
```

**Error Cases:**

- `404` if prompt doesn't belong to user
- `INVALID_DISPLAY_ORDER` if new position is taken

---

### 6. Delete a Prompt Answer

**Endpoint:** `DELETE /user/prompts/{userPromptId}`

**Authentication:** Required

**Path Parameters:**

| Parameter      | Type | Description                   |
| -------------- | ---- | ----------------------------- |
| `userPromptId` | uuid | The user_prompts.id to delete |

**Description:** Deletes the prompt and automatically reorders remaining prompts to fill gaps.

**Response:**

```json
{
    "success": true,
    "message": "Prompt removed and remaining prompts reordered",
    "data": {
        "removed_prompt_id": "user-prompt-uuid",
        "remaining_prompts": [
            {
                "id": "uuid1",
                "display_order": 1,
                "prompt": {
                    "question": "What's your perfect Sunday?"
                },
                "answer": "Coffee and relaxation"
            },
            {
                "id": "uuid2",
                "display_order": 2,
                "prompt": {
                    "question": "Best travel memory?"
                },
                "answer": "Backpacking through Europe"
            }
        ]
    }
}
```

**Reordering Logic:**

- Remaining prompts are automatically renumbered 1, 2, 3, etc.
- Includes rollback on reorder failure
- Returns `REORDER_FAILED` error code if issues occur

**Error Cases:**

- `404` if prompt doesn't belong to user

---

### 7. Reorder All Prompts

**Endpoint:** `PATCH /user/prompts/reorder`

**Authentication:** Required

**Request Body:**

```json
{
    "prompts": [
        {
            "user_prompt_id": "uuid1",
            "display_order": 3
        },
        {
            "user_prompt_id": "uuid2",
            "display_order": 1
        },
        {
            "user_prompt_id": "uuid3",
            "display_order": 2
        }
    ]
}
```

**Validation:**

- All prompts must belong to authenticated user
- Display orders must be unique
- Display orders must be between 1-4

**Response:**

```json
{
    "success": true,
    "message": "Prompts reordered successfully",
    "data": [
        {
            "id": "uuid2",
            "display_order": 1,
            "prompt": {
                "id": "prompt-uuid",
                "question": "Best travel memory?",
                "category": "general"
            },
            "answer": "Backpacking through Europe",
            "is_visible": true
        },
        {
            "id": "uuid3",
            "display_order": 2,
            "prompt": {
                "id": "prompt-uuid",
                "question": "What's your perfect Sunday?",
                "category": "personal"
            },
            "answer": "Coffee and relaxation",
            "is_visible": true
        }
    ]
}
```

**Error Cases:**

- `INVALID_DISPLAY_ORDER` - Duplicate or out-of-range orders
- Invalid prompt IDs that don't belong to user

---

## Implementation Flows

### Onboarding Flow: Setting Up Interests

```javascript
// Step 1: Fetch all available interests
const interestsResponse = await fetch('/api/v1/interests');
const { data: allInterests } = await interestsResponse.json();

// Step 2: User selects interests from UI
const selectedIds = ['uuid1', 'uuid2', 'uuid3'];

// Step 3: Save user's selections
const saveResponse = await fetch('/api/v1/user/interests', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer YOUR_TOKEN',
    },
    body: JSON.stringify({
        interest_ids: selectedIds,
    }),
});

const result = await saveResponse.json();
console.log(`Added ${result.data.added_interests.length} interests`);
```

---

### Onboarding Flow: Setting Up Prompts

```javascript
// Step 1: Fetch available prompts (excluding already answered)
const promptsResponse = await fetch(`/api/v1/prompts?user_id=${userId}&available_only=true`);
const { data: availablePrompts } = await promptsResponse.json();

// Step 2: User selects and answers a prompt
const answerResponse = await fetch('/api/v1/user/prompts', {
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer YOUR_TOKEN',
    },
    body: JSON.stringify({
        prompt_id: 'selected-prompt-uuid',
        answer: 'User typed answer here',
        display_order: 1, // Optional - auto-assigned if omitted
    }),
});

// Step 3: Repeat for up to 4 total prompts
// The system enforces the 4-prompt limit automatically
```

---

### Profile Display Flow

```javascript
// Fetch user's complete profile data in parallel
const [interests, prompts] = await Promise.all([
    fetch(`/api/v1/users/${userId}/interests`).then((r) => r.json()),
    fetch(`/api/v1/users/${userId}/prompts`).then((r) => r.json()),
]);

// Display interests grouped by parent category
const groupedInterests = {};
interests.data.forEach((interest) => {
    const parentName = interest.parent_interest?.name || 'Other';
    if (!groupedInterests[parentName]) {
        groupedInterests[parentName] = [];
    }
    groupedInterests[parentName].push(interest.name);
});

// Display prompts in order
prompts.data.forEach((item) => {
    console.log(`Q: ${item.prompt.question}`);
    console.log(`A: ${item.answer}`);
});
```

---

### Managing Own Profile

```javascript
// Fetch own data (includes hidden prompts)
const myPromptsResponse = await fetch('/api/v1/user/prompts', {
    headers: { Authorization: 'Bearer YOUR_TOKEN' },
});
const { data: myPrompts } = await myPromptsResponse.json();

// Toggle visibility of a prompt
await fetch(`/api/v1/user/prompts/${promptId}`, {
    method: 'PATCH',
    headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer YOUR_TOKEN',
    },
    body: JSON.stringify({
        is_visible: false,
    }),
});

// Reorder prompts via drag-and-drop
await fetch('/api/v1/user/prompts/reorder', {
    method: 'PATCH',
    headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer YOUR_TOKEN',
    },
    body: JSON.stringify({
        prompts: [
            { user_prompt_id: 'uuid1', display_order: 2 },
            { user_prompt_id: 'uuid2', display_order: 1 },
            { user_prompt_id: 'uuid3', display_order: 3 },
        ],
    }),
});
```

---

### User Search/Discovery Flow

```javascript
// Step 1: Get all interests to show filter UI
const interestsResponse = await fetch('/api/v1/interests?parent_only=true');
const { data: categories } = await interestsResponse.json();

// Step 2: User selects interests to filter by
const selectedInterestIds = ['uuid1', 'uuid2'];

// Step 3: Search users (frontend filters locally or backend implements search)
// Note: Current implementation requires frontend to:
// - Fetch multiple user profiles
// - Filter based on shared interests
// Future enhancement: Add `/api/v1/users/search?interest_ids=uuid1,uuid2`

// Example client-side filtering:
async function findUsersByInterests(interestIds) {
    // This would require a dedicated search endpoint
    // or fetching user profiles and filtering client-side
    const response = await fetch('/api/v1/user/search?s=query');
    const { data: users } = await response.json();

    // For each user, fetch their interests and filter
    const usersWithInterests = await Promise.all(
        users.map(async (user) => {
            const interests = await fetch(`/api/v1/users/${user.id}/interests`).then((r) =>
                r.json()
            );
            return { ...user, interests: interests.data };
        })
    );

    return usersWithInterests.filter((user) =>
        user.interests.some((interest) => interestIds.includes(interest.id))
    );
}
```

---

## Error Handling

### Standard Error Response Format

```json
{
    "success": false,
    "message": "Human-readable error message",
    "code": "ERROR_CODE",
    "data": {
        "additional": "context"
    }
}
```

### HTTP Status Codes

| Code  | Meaning      | When Used                                    |
| ----- | ------------ | -------------------------------------------- |
| `200` | OK           | Successful request (even with empty results) |
| `400` | Bad Request  | Validation errors, invalid input             |
| `401` | Unauthorized | Missing or invalid authentication            |
| `404` | Not Found    | User or resource doesn't exist               |
| `500` | Server Error | Unexpected server-side errors                |

### Common Error Codes

#### Interests

| Code                   | HTTP | Description                               | Solution                          |
| ---------------------- | ---- | ----------------------------------------- | --------------------------------- |
| `INVALID_INTEREST_IDS` | 400  | Some interest IDs are invalid or inactive | Provide valid active interest IDs |
| `UPDATE_FAILED`        | 400  | Failed to update interests (rolled back)  | Retry the operation               |

#### Prompts

| Code                    | HTTP | Description                                 | Solution                                          |
| ----------------------- | ---- | ------------------------------------------- | ------------------------------------------------- |
| `DUPLICATE_PROMPT`      | 400  | User already answered this prompt           | Choose a different prompt or update existing      |
| `PROMPT_LIMIT_EXCEEDED` | 400  | User already has 4 prompts                  | Delete a prompt before adding new one             |
| `INVALID_DISPLAY_ORDER` | 400  | Display order already taken or out of range | Use different order (1-4) or omit for auto-assign |
| `REORDER_FAILED`        | 400  | Failed to reorder prompts after deletion    | Check returned state and retry                    |

### Validation Rules Summary

#### Interests

- ✅ No limit on number of interests
- ✅ Each interest can only be selected once per user
- ✅ Only active interests can be selected
- ✅ Parent-child relationships are preserved

#### Prompts

- ✅ Maximum 4 prompts per user
- ✅ Answers must be 5-500 characters
- ✅ HTML in answers is sanitized
- ✅ Display orders must be unique (1-4)
- ✅ Each prompt can only be answered once per user
- ✅ Visibility can be toggled independently

---

## TypeScript Types

```typescript
// Interests
export interface Interest {
    id: string;
    name: string;
    slug: string;
    description: string;
    parent_interest_id: string | null;
    is_active: boolean;
    created_at: string;
    updated_at: string;
    children?: Interest[];
    parent?: {
        id: string;
        name: string;
        slug: string;
    };
}

export interface UserInterest {
    id: string;
    user_id: string;
    interest_id: string;
    selected_at: string;
    interest?: Interest;
}

export interface InterestWithParent extends Omit<Interest, 'children'> {
    parent_interest: {
        id: string;
        name: string;
        slug: string;
    } | null;
    selected_at: string;
}

// Prompts
export interface Prompt {
    id: string;
    question: string;
    category: string;
    placeholder_text: string;
    sort_order: number;
    is_active: boolean;
    created_at: string;
    updated_at: string;
}

export interface UserPrompt {
    id: string;
    user_id: string;
    prompt_id: string;
    answer: string;
    display_order: number;
    is_visible: boolean;
    answered_at: string;
    updated_at: string;
    prompt?: Prompt;
}

export interface UserPromptWithPrompt extends Omit<UserPrompt, 'prompt'> {
    prompt: {
        id: string;
        question: string;
        category: string;
    };
}
```

---

## Notes for Frontend Developers

### Key Considerations

1. **Idempotency**: `POST /user/interests` is idempotent - duplicate interests are skipped gracefully.

2. **Atomicity**: `PUT /user/interests` replaces all interests atomically with automatic rollback on failure.

3. **Auto-Assignment**: When creating prompts without `display_order`, the system automatically finds the next available slot (1-4).

4. **Sanitization**: All prompt answers are sanitized to prevent XSS attacks. HTML tags are stripped.

5. **Public vs Private**:
    - `GET /user/prompts` returns ALL prompts (including hidden) for the authenticated user
    - `GET /users/{userId}/prompts` returns only visible prompts for public viewing

6. **Ordering**:
    - Interests are returned sorted by parent → child name
    - Prompts are returned sorted by display_order
    - Available prompts are sorted by sort_order → question

7. **Error Handling**: Always check the `success` field and handle specific error `code` values for better UX.

8. **Rate Limiting**: Consider implementing debouncing for search/filter operations.

---

## Future Enhancements

Potential improvements not yet implemented:

1. **Interest Search Endpoint**: `GET /users/search?interest_ids=uuid1,uuid2` for finding users by shared interests
2. **Prompt Categories**: Better categorization and filtering of prompts
3. **Interest Statistics**: Popular interests, trending interests
4. **Prompt Analytics**: Most answered prompts, prompt engagement rates
5. **Bulk Operations**: Batch add/remove interests with optimized queries
6. **Interest Recommendations**: Suggest interests based on user activity

---

## Support

For questions or issues with this API, please contact the backend team or file an issue in the repository.

**Last Updated:** 2024-01-15
**API Version:** v1
**Maintainer:** Backend Team
