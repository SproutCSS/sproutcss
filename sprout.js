#!/usr/bin/env node

const { opendir, readFile, writeFile, appendFile } = require('node:fs/promises');
const { resolve, join } = require('node:path');
// const { config } = require('../../sprout.config');

const rootPath = resolve(__dirname, '../../..');
const config = require(join(rootPath, 'sprout.config.js'));
const { config } = require('./sprout.config');

// use the config object
console.log(config);


let writePath = "";

(async function () {
    let classesStr = "";
    console.log("running");
    try {
        // get all unique css classes in the directory, filter out empty strings, and sort alphabetically
        const allClasses = [...new Set(await getFiles(".", config.files))].filter(Boolean).sort();

        const filePath = resolve("./sprout.css");
        const contents = await readFile(filePath, { encoding: 'utf8' });

        // copy over :root & darkmode root variables
        const vars = contents.match(/\:root\s*{[\s\S]*?}/gm).join("\n");
        let rootArr = [];
        const darkmodeVars = contents.match(/\[data-theme="dark"]\s*{[\s\S]*?}/gm).join("\n");

        let darkmodeArr = [];


        for (let i = 0; i < allClasses.length; i++) {
            const regex = new RegExp('\\.' + allClasses[i] + '\\s*{[\\s\\S]*?}', 'gm');
            const result = contents.match(regex);

            // get css variables
            const variables = result.join("\n").matchAll(/var\((.*?)\)/gm);
            for (let variable of variables) {

                const varRegex = new RegExp(variable[1] + ':.*?\n', 'gm');
                rootArr.push(...vars.match(varRegex));
                // SOMETHING STRANGE HERE AFTER ADDING .JS FILE OPTION
                let darkmodeResult = darkmodeVars.match(varRegex);
                if (darkmodeResult != null) {
                    darkmodeArr.push(darkmodeResult[0]);
                }
            }
            if (result != null) {
                classesStr += `\n${result}`;
            }
        }

        rootArr = [...new Set(rootArr)].sort().join(' ');
        darkmodeArr = [...new Set(darkmodeArr)].sort().join(' ');

        await writeFile(writePath, `:root {\n${rootArr}}`);
        await appendFile(writePath, `\n[data-theme="dark"]{\n${darkmodeArr}}`);
        await appendFile(writePath, `\n${classesStr}`);

    } catch (err) {
        console.error(err);
    }
})();

// https://stackoverflow.com/questions/39467754/pushing-to-array-and-returning-it-from-the-recursive-function
async function getFiles(folder, files) {
    let allClasses = [];
    const dir = await opendir(folder);

    for await (const dirent of dir) {
        // get path of file to write to, defined in sprout.config
        if (dirent.name == config.filename) {
            writePath = `${folder}/${dirent.name}`;
            console.log(writePath);
        }

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
            if (components.includes(arr[0])) {
                transformClasses(arr)
            }
            else {
                for (let i = 1; i < arr.length; i++) {
                    if (components.includes(arr[i])) {
                        // move component to index 0
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

    // color on hover is either specificed h-[color] or its specified color or primary
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
