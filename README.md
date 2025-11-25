# Zip to H3 Hex Converter

A beautiful, interactive web application that converts US zip codes, addresses, and custom drawn areas into [H3 hexagonal hierarchical geospatial indexes](https://h3geo.org/). Built with React, TypeScript, and Leaflet for a stunning map-based experience.

![License](https://img.shields.io/badge/license-MIT-blue.svg)

## ✨ Features

### 🗺️ Multiple Input Methods
- **Zip Code Search**: Enter any US zip code to visualize its boundary and generate H3 hexagons
- **Address Search**: Search for any address and generate H3 hexagons for that location
- **Draw Mode**: Draw custom polygons directly on the map to generate H3 hexagons for any area

### 🎯 Advanced Functionality
- **Adjustable Resolution**: Choose H3 resolution levels (0-15) to control hexagon granularity
- **Fill Gaps**: Option to fill gaps in generated hexagon coverage for complete area coverage
- **Opacity Control**: Adjust hexagon layer opacity for better visualization
- **Persistent State**: Your hexagons, settings, and drawn areas automatically persist across browser sessions
- **Copy to Clipboard**: Easily copy all generated H3 hex codes with one click
- **Interactive Popups**: Click on any hexagon to view its H3 code and copy it individually

## 📖 Usage

### Zip Code Mode
1. Select "Zip" mode from the control panel
2. Enter a US zip code (e.g., "10001")
3. Choose your desired H3 resolution (8-10 recommended for zip codes)
4. Toggle "Fill Gaps" if you want complete coverage
5. Click "Search" to generate hexagons

### Address Mode
1. Select "Address" mode from the control panel
2. Enter any address (e.g., "1600 Amphitheatre Parkway, Mountain View, CA")
3. Click "Search" to generate hexagons at the address location

### Draw Mode
1. Select "Draw" mode from the control panel
2. Use the drawing tools on the map to create a custom polygon
3. Hexagons will automatically generate for your drawn area
4. Adjust resolution and fill gaps settings to refine the output

### Exporting Data
- Click the "Copy All Hex Codes" button to copy all generated H3 codes to your clipboard
- Click on individual hexagons to copy their specific H3 code


## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📧 Contact

For questions or feedback, use the contact form in the application or open an issue on GitHub.

## 🙏 Acknowledgments

- [Uber H3](https://h3geo.org/) for the hexagonal hierarchical geospatial indexing system
- [OpenDataSoft](https://public.opendatasoft.com/) for US zip code boundary data
- [OpenStreetMap](https://www.openstreetmap.org/) via Nominatim for geocoding services
- [Leaflet](https://leafletjs.com/) for the amazing mapping library

---

Built with ❤️ using React, TypeScript, and H3
