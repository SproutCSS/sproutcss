#!/usr/bin/env node

const { writeFile } = require('node:fs/promises');
let command = process.argv[2]

if (command != null) {
    command = command.toLowerCase();
    if (command == '--setup' || command == '-s') {
        setupConfig();
    }
    else if (command == "--help" || command == '-h') {
        const package = require('./package.json');
        console.log([
            'SproutCSS\n',
            'For further instructions, see documentation:\n',
            `  ${package.homepage}\n`,
            '\n',
            'Options:\n',
            '  --setup   Generate configuration file\n',
            '  --version Show version number\n',
            '  --help    Show help\n',
            '\n',
            'Usage:\n',
            '  npx sproutcss --setup\n',

        ].join(""))
    }
    else if (command == "--version" || command == '-v') {
        console.log("sproutcss v" + package.version + '\n')
    }
    return
}

// if configuration file exists, continue
// else, add sprout.config.js and return
try {
    // console.log(require.resolve('./sprout.config.js'));
    const apple = "fruit";
}
catch {
    console.error("Configuration file not found.");
    setupConfig();
    return
}

const { opendir, readFile, appendFile } = require('node:fs/promises');
const { resolve, join } = require('node:path');

// const rootPath = resolve(__dirname, '../../');
// const { config } = require.resolve(join(rootPath, 'sprout.config.js'));
let config = {
    path: "./sprout.css",
    files: [
        "html",
        "js"
    ]
};

(async function () {
    let classesStr = "";

    // remove "." from front of file extension names if present
    for (let i = 0; i < config.files.length; i++) {

        if (config.files[i].startsWith(".")) {
            config.files[i] = config.files[i].slice(1);
        }
    }

    try {
        // get all unique css classes in the repository, filter out empty strings, and sort alphabetically
        const allClasses = [...new Set(await getFiles(".", config.files))].filter(Boolean).sort();

        const filePath = resolve(__dirname, "./sprout.css");
        const contents = await readFile(filePath, { encoding: 'utf8' });

        // copy over :root & darkmode root variables
        const vars = contents.match(/\:root\s*{[\s\S]*?}/gm).join("\n");
        let rootArr = [];
        const darkmodeVars = contents.match(/\[data-theme="dark"]\s*{[\s\S]*?}/gm).join("\n");
        let darkmodeArr = [];


        for (let i = 0; i < allClasses.length; i++) {
            const regex = new RegExp('\\.' + allClasses[i] + '\\s*{[\\s\\S]*?}', 'gm');
            const result = contents.match(regex);

            if (result != null) {

                // get css variables
                const variables = result.join("\n").matchAll(/var\((.*?)\)/gm);
                for (let variable of variables) {

                    const varRegex = new RegExp(variable[1] + ':.*?\n', 'gm');
                    rootArr.push(...vars.match(varRegex));
                    let darkmodeResult = darkmodeVars.match(varRegex);
                    if (darkmodeResult != null) {
                        darkmodeArr.push(darkmodeResult[0]);
                    }
                }
                classesStr += `\n${result}`;
            }
            else {
                console.error(allClasses[i], "CSS style is missing")
            }
        }

        rootArr = [...new Set(rootArr)].sort().join(' ');
        darkmodeArr = [...new Set(darkmodeArr)].sort().join(' ');

        await writeFile(config.path, `/* Generated SproutCSS stylesheet \n CHANGES TO THIS FILE WILL BE OVERWRITTEN ON NEXT NPX SPROUTCSS.\n CHANGES T0 SPROUT CLASSES SHOULD BE MADE TO NODE_MODULES/SPROUTCSS/SPROUT.CSS BEFORE GENERATING IF NECESSARY */\n\n`);
        await appendFile(config.path, `:root {\n${rootArr}}`);
        await appendFile(config.path, `\n[data-theme="dark"]{\n${darkmodeArr}}`);
        await appendFile(config.path, `\n${classesStr}`);

        console.log('Custom stylesheet generated at ' + config.path);
    } catch (err) {
        console.error(err);
    }
})()

// https://stackoverflow.com/questions/39467754/pushing-to-array-and-returning-it-from-the-recursive-function
async function getFiles(folder, files) {
    let allClasses = [];
    const dir = await opendir(folder);

    for await (const dirent of dir) {

        if (files.includes(dirent.name.split('.').pop()) || (!dirent.name.includes('.') && dirent.name != "node_modules")) {

            if (dirent.isDirectory()) {
                allClasses = allClasses.concat(await getFiles(`${folder}/${dirent.name}`, files));
            }
            else {
                // get a all the css classes at filepath
                allClasses.push(...await getCSS(`${folder}/${dirent.name}`));
            }
        }
    }

    return allClasses;
}


async function getCSS(file) {
    const components = ["icn-btn", "btn", "crd", "otln-crd", "shdw-btn", "icn-btn", "txt-i", "nmbr-i", "nv"];

    try {
        const filePath = resolve(file);
        const contents = await readFile(filePath, { encoding: 'utf8' });

        const results = contents.matchAll(/class="(?<css>[\s\S]*?)"/gm);
        let classes = []
        for (let result of results) {
            const { css } = result.groups;
            const arr = css.split(" ");
            // if the first css class is a component name
            if (components.includes(arr[0])) {
                transformClasses(arr)
            }
            else {
                for (let i = 1; i < arr.length; i++) {
                    if (components.includes(arr[i])) {
                        // when component name is found, move it to index 0
                        arr.splice(i + 1, 0, arr.splice(i, 1)[0]);
                        transformClasses(arr);
                        break;
                    }
                }
            }
            classes.push(...arr);
        }
        return classes
    } catch (err) {
        console.error(err.message);
    }

}

function transformClasses(arr) {
    const colors = ["black", "grey", "primary", "red", "orange", "yellow", "green", "blue", "purple", "pink"];

    // if component has a  h-[color], hoverColor = h-[color]
    // else if component has a [color], hoverColor = [color] 
    // else hoverColor = primary
    let hoverColor = colors.filter(a => arr.includes(`h-${a}`))[0];
    if (hoverColor == null) {
        hoverColor = colors.filter(a => arr.includes(a))[0];
    }

    for (let i = 1; i < arr.length; i++) {

        if (arr[i].trim() == '\n' || arr[i].trim() == "") {
            arr[i] = "";
        }
        else {
            if (arr[i].startsWith("h-") && arr[i] != 'h-primary') {
                if (arr[i] != "h-translate" && arr[i] != "h-no-translate") {
                    if (hoverColor != null) {
                        if (arr[i] != `h-${hoverColor}`) {
                            arr[i] = `${arr[0]}.h-${hoverColor}.${arr[i]}:hover`;
                        }
                        else {
                            arr[i] = `${arr[0]}.${arr[i]}:hover`;
                        }
                    }
                    else {
                        for (let j = 1; j < arr.length; j++) {
                            if (colors.includes(arr[j])) {

                                arr[i] = `${arr[0]}.${arr[j]}.${arr[i]}:hover`;
                                break;
                            }
                            if (j == arr.length - 1) {

                                arr[i] = `${arr[0]}.${arr[i]}:hover`;
                            }
                        }
                    }
                }
                else {
                    arr[i] = `${arr[0]}.${arr[i]}:hover`;
                }
            }

            else {
                if (arr[i] != 'primary') {
                    arr[i] = `${arr[0]}.${arr[i]}`;
                }
            }
        }
    }
}


async function setupConfig() {
    console.log("Created sprout.config.js\nPlease add the correct file extentions to the files array.\n")
    try {
        await writeFile("./sprout.config.js", [
            'module.exports = {\n',
            '   path: "./sprout.css",\n',
            '   files: [\n',
            '       "html"\n',
            '   ]\n',
            '}\n'
        ].join(" ")
        )
    }
    catch (err) {
        console.error(err)
    }
}