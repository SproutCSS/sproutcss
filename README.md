## SproutCSS 🌱

Sprout is a collection of CSS component blueprints.

View the components [here.](https://sprout-docs.vercel.app)

Check out the source code on [Github.](https://github.com/dejmedus/sproutcss)

🐛 Find a bug? Feel free to [report it.](https://github.com/dejmedus/sproutcss/issues)

### Get Started
1. Install the SproutCSS module

```
  npm install --save-dev sproutcss
```

2. Import the stylesheet
 
``` css title="index.css"
@import "./node_modules/sproutcss/sprout.css";
```
3. Copy and paste [components](https://sprout-docs.vercel.app/docs/usage) as needed.
4. When you're ready, [generate a custom stylesheet](https://sprout-docs.vercel.app/docs/custom-stylesheet).
5. Enjoy!

### Change Log
View the full changelog [here](https://sprout-docs.vercel.app/changelog)
#### 1.3.0
*What's Changed*
- No more unused styling 🥳. Sprout now [generates a custom css file.](https://sprout-docs.vercel.app/docs/custom-stylesheet)
- Therefore, this package is no longer needed in production. Install as a dev dependency.
- If a component color is not specified, Sprout will now default to the primary color.

*What's New*

- More customization options. Colors, hover styles, and border widths.
- New color options. Choose from primary, black, grey, red, orange, yellow, green, blue, purple, and pink.
