# Frontend Integration Tests

This directory contains integration tests for the category feature in the UpSkillPro frontend application.

## Test Files

### Integration Tests

- `integration/category-filter.integration.test.jsx` - Tests for student course filtering flow
- `integration/instructor-category.integration.test.jsx` - Tests for instructor category management

### Component Tests

- `../components/__tests__/CategoryFilter.test.jsx` - Unit tests for CategoryFilter component

## Prerequisites

Before running the tests, you need to install testing dependencies:

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event jest jest-environment-jsdom
```

## Setup

The tests are configured to work with Next.js and use:

- Jest as the test runner
- React Testing Library for component testing
- Redux mock store for state management testing
- jsdom for DOM simulation

Configuration files:

- `jest.config.js` - Jest configuration
- `jest.setup.js` - Test environment setup

## Running Tests

Add test script to `package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

Run all tests:

```bash
npm test
```

Run only integration tests:

```bash
npm test -- integration
```

Run with coverage:

```bash
npm test:coverage
```

Run in watch mode:

```bash
npm test:watch
```

## Test Coverage

### Student Category Filter Integration Tests

- Category loading on page mount
- Course filtering when category is selected
- Clearing filter to show all courses
- Course list updates when category changes
- Category badge display on course cards
- Empty state when no courses in category
- Filter persistence in sessionStorage
- Filter restoration on page reload

### Instructor Category Integration Tests

- Category dropdown in course creation form
- Category validation before course submission
- Including categoryId in course creation payload
- Filtering instructor's courses by category
- Displaying course count per category
- Filter persistence during session
- Filter clearing on logout

## Test Structure

Each integration test follows this pattern:

1. **Setup**: Create mock store, clear storage, reset mocks
2. **Render**: Render component with Provider
3. **Interact**: Simulate user interactions (clicks, form inputs)
4. **Assert**: Verify expected behavior and state changes
5. **Cleanup**: Automatic cleanup by React Testing Library

## Mocking

The tests mock:

- API calls (`utils/api/categoryApi`, `utils/api`)
- Redux store (using configureStore from @reduxjs/toolkit)
- sessionStorage and localStorage
- Browser APIs (matchMedia, IntersectionObserver)

## Best Practices

1. **Isolation**: Each test is independent and doesn't rely on others
2. **Cleanup**: Storage and mocks are cleared before each test
3. **Async Handling**: Use `waitFor` for async operations
4. **User-Centric**: Tests simulate real user interactions
5. **Accessibility**: Use accessible queries (getByRole, getByLabelText)

## Troubleshooting

### Tests fail with "Cannot find module"

- Ensure all dependencies are installed
- Check import paths in test files

### Tests timeout

- Increase timeout in jest.config.js
- Check for unresolved promises in tests

### Redux store errors

- Verify reducer imports
- Check initial state structure

### Mock not working

- Clear mocks in beforeEach
- Verify mock implementation

## Notes

- Tests use mock data, not real API calls
- sessionStorage is mocked for testing
- Tests are designed to run in CI/CD pipelines
- Coverage reports are generated in `coverage/` directory
