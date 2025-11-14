# PILOT Extensions - Example Applications for PILOT 

![PILOT Extensions](https://img.shields.io/badge/PILOT-Extensions-blue)
![Ext JS](https://img.shields.io/badge/Ext%20JS-7.7%2B-orange)
![License](https://img.shields.io/badge/License-MIT-green)

This repository contains example extensions and applications for **PILOT Extensions** - a platform for developing custom applications in the PILOT monitoring system.

## 🚀 What is PILOT Extensions?

**PILOT Extensions** allows developers to create custom applications that:
- Extend PILOT system functionality
- Integrate third-party services
- Add new interface elements
- Use data from the monitoring system

## 📁 Repository Structure

```
pilot_extensions/
├── examples/              # Example applications
│   ├── hello-world/      # Basic "Hello World" example
│   ├── airports-list/    # Airports list with map
│   ├── solar-system/     # Solar system planets example
│   └── template-app/     # Template for new applications
├── docs/                 # Documentation
├── tools/                # Utility tools
└── README.md            # This file
```

## 🛠️ Quick Start

### Prerequisites

1. **PILOT Access** with partner/administrator rights
2. **Web Server** for hosting application files
3. **Basic knowledge** of JavaScript and Ext JS

### First Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/pilot-telematics/pilot_extensions.git
   cd pilot_extensions
   ```

2. **Explore the "Hello World" example**
    - Open `examples/hello-world/`
    - This is a minimal working application example

3. **Set up your application**
    - Use `examples/template-app/` as a base
    - Change class names and files according to your project

4. **Host files on your server**
    - Ensure `Module.js` is accessible via direct URL
    - Example: `http://your-server.com/your-app/Module.js`

5. **Create application in PILOT**
    - Go to **Admin Panel → Applications → Add**
    - Fill out the form with your application URL
    - Wait 10 minutes for proxy configuration

## 📚 Example Applications

### 🎯 Hello World
**Path:** `examples/hello-world/`
- Simplest application example
- Adds tab to navigation
- Adds panel to main area
- Perfect for initial familiarization

### ✈️ Airports List
**Path:** `examples/airports-list/`
- Airports list with map display
- Demonstrates working with markers
- Example of using map API

### 🪐 Solar System
**Path:** `examples/solar-system/`
- Interactive solar system planets list
- Example of working with data without maps
- Demonstrates creating custom interfaces

### 📐 Template App
**Path:** `examples/template-app/`
- Ready template for new projects
- Includes all necessary structure
- Contains comments and hints

## 🏗️ Application Architecture

Each application must contain:

### Required Files:
- **`Module.js`** - main application file (entry point)
- **`doc/index.html`** - documentation for Extension

### Optional Files:
- **`*.js`** - additional Ext JS classes
- **`*.css`** - application styles
- **`*.json`** - configuration data

### Basic Class Structure:
```javascript
Ext.define('Store.your-app.Module', {
    extend: 'Ext.Component',
    
    initModule: function () {
        // 1. Create components
        var navTab = Ext.create('YourNavigationComponent');
        var mainPanel = Ext.create('YourMainComponent');
        
        // 2. Link them
        navTab.map_frame = mainPanel;
        
        // 3. Add to PILOT interface
        skeleton.navigation.add(navTab);
        skeleton.mapframe.add(mainPanel);
    }
});
```

## 🔧 Available APIs

### Working with Interface
```javascript
// Adding tab to navigation
skeleton.navigation.add(component);

// Adding panel to main area
skeleton.mapframe.add(component);

// Adding button to top panel
skeleton.header.insert(position, button);
```

### Working with Maps
```javascript
// Creating map
var map = new MapContainer('map-name');
map.init(lat, lon, zoom, elementId, config);

// Adding marker
map.addMarker({id: "marker1", lat: 55.75, lon: 37.65});

// Adding polygon
map.setPolygon(points, options);
```

### Working with Data
```javascript
// Getting objects tree
Ext.Ajax.request({
    url: '/ax/tree.php',
    params: {vehs: 1, state: 1},
    success: function(response) {
        // Process data
    }
});
```

## 🚀 Deployment

### Local Development
1. Host files on local server
2. Create application in PILOT with local server URL
3. Use browser developer tools for debugging

### Production Deployment
1. Host files on production server
2. Update URL in PILOT application settings
3. Request publication from technical support

## 🐛 Debugging and Troubleshooting

### Common Issues:

1. **Application not loading**
    - Check accessibility of `Module.js` via specified URL
    - Ensure 10 minutes passed after application creation
    - Check browser console for errors

2. **JavaScript errors**
    - Use `console.log()` for debugging
    - Check Ext JS class names correctness
    - Ensure proper `skeleton` structure

3. **Map issues**
    - Ensure map initializes after component render
    - Check coordinate correctness
    - Use `resize` handler for map size recalculation

### Debugging Tools:
- **Browser**: F12 → Console, Network, Debugger
- **Ext JS**: `Ext.log()` for logging
- **PILOT**: Global variable `skeleton` for interface access

## 🤝 How to Contribute

We welcome your examples and improvements!

1. **Fork the repository**
2. **Create a branch for your example** (`git checkout -b feature/amazing-example`)
3. **Commit your changes** (`git commit -m 'Add amazing example'`)
4. **Push the branch** (`git push origin feature/amazing-example`)
5. **Create a Pull Request**

### Example Requirements:
- ✔️ Working code without errors
- ✔️ Clear documentation in `doc/index.html`
- ✔️ Code comments 
- ✔️ Compliance with project code style

## 📖 Additional Resources

- [**Official PILOT Documentation**](https://pilot-gps.com/docs) - complete developer guide
- [**Ext JS Documentation**](https://docs.sencha.com/extjs/7.7.0/) - framework guide
- [**Leaflet Documentation**](https://leafletjs.com/reference.html) - working with maps
- [**FontAwesome Icons**](https://fontawesome.com/icons) - available icons for interface

## 📄 License

This project is licensed under the MIT License. See `LICENSE` file for details.

## 💬 Support

- **Development Questions**: Create an Issue in this repository
- **PILOT Technical Support**: support@pilot-gps.com
- **Documentation**: [PILOT Developer Portal](https://developer.pilot-gps.com)

## 🏆 Acknowledgments

Thanks to all developers who contribute their examples and improvements for the PILOT community!

---

**Happy coding!** 🎉

*Created for the PILOT developer community*