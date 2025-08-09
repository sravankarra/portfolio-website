# Portfolio Website with Admin Panel

A modern, responsive portfolio website built with Python Flask framework, featuring an admin panel for easy content management.

## Features

- **Modern Design**: Clean, responsive design with gradient backgrounds and smooth animations
- **Admin Panel**: Easy-to-use interface to manage your portfolio content
- **Responsive**: Works perfectly on desktop, tablet, and mobile devices
- **Dynamic Content**: Add, edit, and delete skills, projects, and social links
- **Real-time Updates**: Changes appear immediately on your portfolio

## Sections

1. **Hero Section**: Your name, title, and profile picture
2. **About**: Personal information and contact details
3. **Skills**: Display your skills with progress bars
4. **Projects**: Showcase your work with images and links
5. **Contact**: Contact information and social media links

## Setup Instructions

### 1. Install Python Dependencies

```bash
pip install -r requirements.txt
```

### 2. Run the Application

```bash
python app.py
```

### 3. Access Your Portfolio

- **Main Portfolio**: http://localhost:5000
- **Admin Panel**: http://localhost:5000/admin

## Admin Panel Usage

### Personal Information
- Update your name, title, and about section
- Modify contact details (location, email, phone)

### Skills Management
- Add new skills with proficiency levels (0-100%)
- Categorize skills (Programming, Design, etc.)
- Delete existing skills

### Projects Management
- Add new projects with descriptions
- Include project images (URLs)
- Add GitHub and live demo links
- Specify technologies used

### Social Links
- Add social media profiles
- Customize icons using FontAwesome classes
- Include any platform links

## Customization

### Profile Picture
To add your profile picture:
1. Upload your image to an image hosting service (e.g., Imgur, Cloudinary)
2. Copy the image URL
3. Add it to the `profile_image` field in the admin panel

### Colors and Styling
Modify `static/css/styles.css` to change:
- Color scheme
- Fonts
- Layout spacing
- Animations

### Adding New Sections
1. Add new routes in `app.py`
2. Create new templates in `templates/`
3. Add corresponding CSS styles

## File Structure

```
portfolio-website/
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── portfolio_data.json   # Portfolio data storage
├── templates/            # HTML templates
│   ├── index.html       # Main portfolio page
│   └── admin.html       # Admin panel
├── static/              # Static assets
│   ├── css/            # Stylesheets
│   │   ├── styles.css  # Main styles
│   │   └── admin.css   # Admin panel styles
│   └── js/             # JavaScript files
│       ├── script.js   # Main portfolio scripts
│       └── admin.js    # Admin panel scripts
└── README.md            # This file
```

## Data Storage

Your portfolio data is stored in `portfolio_data.json`. This file is automatically created when you first run the application and contains:

- Personal information
- Skills list
- Projects list
- Social media links

## Security Notes

- Change the `secret_key` in `app.py` for production use
- The admin panel is publicly accessible - consider adding authentication for production
- All data is stored locally in JSON format

## Browser Support

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers

## Deployment

### Local Development
```bash
python app.py
```

### Production Deployment
For production deployment, consider:
- Using a production WSGI server (Gunicorn, uWSGI)
- Adding authentication to the admin panel
- Using a proper database instead of JSON files
- Setting up HTTPS
- Using environment variables for configuration

## Support

If you encounter any issues:
1. Check that all dependencies are installed
2. Ensure Python 3.7+ is being used
3. Verify all files are in the correct directory structure
4. Check the console for error messages

## License

This project is open source and available under the MIT License. 