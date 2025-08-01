# LinkedIn PDF Import Feature

This feature allows users to automatically populate their profile data by uploading a LinkedIn PDF export.

## How it Works

1. **User exports their LinkedIn profile as PDF**
   - Go to LinkedIn profile page
   - Click "More" → "Save to PDF"
   - Download the generated PDF

2. **User uploads PDF through the profile interface**
   - Click "Import from LinkedIn" button in profile header
   - Upload the LinkedIn PDF file
   - Review extracted data
   - Apply to profile

3. **System processes and extracts data**
   - PDF is sent to backend extraction service
   - AI/ML algorithms extract structured data
   - Data is mapped to profile fields
   - User can review before applying

## Components

### Frontend Components
- `LinkedInUpload.tsx` - Main upload component with step-by-step wizard
- Profile page integration with import button and data handling
- Toast notifications for user feedback

### API Routes
- `/api/linkedin-pdf-extract` - Handles PDF upload and extraction
- Includes mock data fallback for development

### Backend Integration
- Calls external extraction service at `/extract-linkedin-data`
- Handles file validation and error management
- Returns structured profile data

## Data Extracted

The system can extract the following information from LinkedIn PDFs:

### Basic Information
- Full name
- Professional title
- Bio/summary
- Location
- Contact information (email, phone)
- LinkedIn profile URL
- Personal website

### Professional Experience
- Company names
- Job titles
- Employment durations
- Job descriptions

### Education
- Institutions
- Degrees/qualifications
- Graduation years
- Additional details

### Skills
- Skill names
- Categorization (Technical, Design, Leadership, etc.)
- Proficiency levels (estimated)

### Certifications
- Certificate names
- Issuing organizations
- Issue and expiry dates
- Credential IDs

## Implementation Details

### Data Merging Strategy
- New LinkedIn data is merged with existing profile data
- Duplicates are detected and avoided
- User can review all changes before saving
- Existing data is preserved when not conflicting

### Error Handling
- File type validation (PDF only)
- File size limits (10MB max)
- Network error handling
- User-friendly error messages

### Mock Data
- Development environment uses mock data
- Realistic sample data for testing
- Simulates 2-second processing time
- Can be disabled by setting backend URL

## Configuration

### Environment Variables
```env
NEXT_PUBLIC_BACKEND_URL_USER_PORTAL=your_backend_url
FLASK_INTERNAL_API_KEY=your_api_key
NODE_ENV=development # Enables mock data
```

### Mock Data Control
- Set `USE_MOCK_DATA = true` in API route for testing
- Mock data provides realistic sample profile
- Useful for frontend development and demos

## User Experience

### Step-by-Step Process
1. **Upload** - Drag and drop or click to select PDF
2. **Process** - Visual progress indicator during extraction
3. **Preview** - Review extracted data in organized cards
4. **Apply** - Merge data into profile with confirmation

### Visual Feedback
- Progress indicators during processing
- Success/error notifications
- Data preview with categorized information
- Clear instructions for LinkedIn export

## Security Considerations

- File type validation prevents non-PDF uploads
- File size limits prevent abuse
- Backend API key authentication
- No permanent storage of uploaded PDFs
- User consent required before applying data

## Future Enhancements

- Support for other professional platforms
- Advanced ML for better skill categorization
- Confidence scores for extracted data
- Bulk import from multiple sources
- Integration with real-time LinkedIn API

## Testing

### Development Testing
1. Enable mock data mode
2. Upload any PDF file (mock data will be returned)
3. Verify data extraction and merging logic
4. Test error handling scenarios

### Production Testing
1. Export actual LinkedIn PDF
2. Upload through the interface
3. Verify extracted data accuracy
4. Test with various LinkedIn profile formats 