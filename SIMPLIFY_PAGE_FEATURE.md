# Simplify Entire Page Feature

## Overview
Added functionality to simplify all text content on a webpage, not just highlighted text.

## Changes Made

### 1. Popup UI (`src/ui/popup.tsx`)
- **Added "Simplify Entire Page" button** in a new "Page Actions" section
- Button sends a `SIMPLIFY_PAGE` message to the active tab's content script
- Button is disabled when the extension is disabled or while saving settings
- Updated Quick Guide step 3 to mention the new page simplification feature
- Added `simplifyCurrentPage()` function to handle button clicks

### 2. Content Script (`src/content/index.tsx`)
- **Added message handler** for `SIMPLIFY_PAGE` messages
- **Implemented `simplifyEntirePage()` method** that:
  - Extracts all meaningful text nodes from the page
  - Sends each text node for simplification
  - Applies visual highlighting to simplified text
  - Shows progress bar during processing
  - Displays completion notification

- **Implemented `extractPageTextNodes()` method** that:
  - Uses TreeWalker API to find all text nodes
  - Filters out scripts, styles, hidden elements, and extension elements
  - Only includes text nodes with meaningful content (8+ characters)

- **Implemented `applySimplificationToNode()` method** that:
  - Wraps simplified text in a styled span element
  - Highlights simplified text with blue background and dotted underline
  - Adds click handler to toggle between original and simplified text
  - Shows original text in tooltip on hover

- **Added visual feedback methods**:
  - `showPageSimplificationProgress()` - Shows a progress bar at the top
  - `hidePageSimplificationProgress()` - Removes progress bar
  - `showCompletionNotification()` - Shows success notification

### 3. Type Definitions (`src/types.d.ts`)
- Added `PageSimplificationRequest` interface for the new message type
- Updated `MessageRequest` union type to include `PageSimplificationRequest`

### 4. Styling (`src/ui/ui.css`)
- Added `.page-actions` section styling with gradient background
- Added `.simplify-page-button` styling with:
  - Gradient blue background
  - Hover effects with elevation
  - Sparkle animation for the icon
  - Responsive button layout
- Added dark mode support for all new styles

## User Experience

### How to Use
1. **Open the extension popup** by clicking the extension icon
2. **Click "Simplify Entire Page"** button in the Page Actions section
3. **Watch the progress bar** as text is simplified
4. **See highlighted text** - simplified portions have a blue highlight with dotted underline
5. **Toggle text** - click any highlighted text to switch between simplified and original
6. **Hover for original** - hover over simplified text to see the original in a tooltip

### Visual Feedback
- **Progress Bar**: Shows at the top of the page during simplification
- **Highlighted Text**: Blue background with dotted underline for simplified text
- **Clickable Toggles**: Click to switch between simplified (blue) and original (yellow) text
- **Completion Notification**: Success message appears in top-right corner when done

## Technical Details

### Rate Limiting
- Small 100ms delay between simplifications to avoid overwhelming the API
- Existing rate limiting in background script still applies

### Text Node Filtering
The system intelligently filters text nodes to avoid:
- Scripts and style elements
- Hidden or invisible elements
- Extension's own UI elements
- Very short text (< 8 characters)
- Whitespace-only or punctuation-only text

### Performance Considerations
- Text nodes are processed sequentially with delays
- Progress bar updates after each node
- DOM mutations are batched per text node
- No re-rendering of entire page

## Testing Recommendations
1. Test on various websites with different structures
2. Test with extension enabled/disabled
3. Test the toggle functionality on simplified text
4. Test on pages with mixed content (text, images, videos)
5. Verify progress bar appears and updates correctly
6. Verify completion notification appears and auto-dismisses

## Future Improvements (Optional)
- Add ability to restore entire page to original
- Add batch processing with parallel API calls
- Add option to simplify only visible text
- Add undo/redo functionality
- Cache simplifications to avoid re-processing
- Add keyboard shortcut for page simplification

