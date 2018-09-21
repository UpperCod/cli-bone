#!/usr/bin/env node

const { template, mkdirpath, removedir } = require("template-folder");

const { promisify } = require("util");
const path = require("path");
const lstat = promisify(require("fs").lstat);

const download = promisify(require("download-git-repo"));
const bones = "bones/";
const config = "bone.config.js";
const program = require("commander");
const prompts = require("prompts");
const logUpdate = require("log-update");
const script = require("esm")(module);
const spinners = require("cli-spinners");

program
    .version("0.1.4")
    .usage("<git> [-d sample/dist]")
    .description(
        "bone, allows you to use folders templates extracted from git repositories"
    )
    .option("-d, --dist <directory>", "destination of the template")
    .option("-u, --update", "update the local source")
    .option("-r, --remove", "delete the local source")
    .option("-c, --clone", "allows you to use a local source for cloning")
    .action((env, { dist = "", update, remove, clone } = {}) => {
        let source = clone
                ? path.resolve(process.cwd(), env)
                : path.resolve(__dirname, bones + env),
            ready = loading(spinners.dots, "Preparing template folder");
        if (remove) {
            lstat(source)
                .then(() => removedir(source))
                .then(ready);
            return;
        }

        let pipe = lstat(source);

        if (!clone) {
            pipe = pipe
                .then(
                    () =>
                        update && removedir(source).then(download(env, source))
                )
                .catch(() => download(env, source));
        }

        pipe.then(() => {
            let sourceConfig = path.join(source, config);
            return lstat(sourceConfig)
                .then(() => script(sourceConfig))
                .catch(() => {});
        })
            .then(load => {
                ready();
                let fill = data => data,
                    {
                        description = "",
                        questions = [],
                        onCancel = fill,
                        onSubmit = fill
                    } = load ? load.default : {};
                if (description) console.log("\n" + description + "\n");
                if (questions.length) {
                    return new Promise((resolve, reject) => {
                        prompts(load.default.questions, {
                            onCancel(data) {
                                onCancel(data);
                                reject({});
                            }
                        }).then(data => resolve(onSubmit(data)));
                    });
                } else {
                    return onSubmit({});
                }
            })
            .then(data => {
                data = data || {};
                let handler = () => {
                    console.log(
                        `\nProcess completed, check the folder: ${path.join(
                            dist,
                            data.$dist || ""
                        )}`
                    );
                };
                return template(
                    path.join(source, data.$source || ""),
                    path.resolve(process.cwd(), dist, data.$dist || ""),
                    data,
                    [config]
                )
                    .then(handler)
                    .catch(handler);
            })
            .catch(() => {
                console.log("\nProcess canceled");
            });
    })
    .parse(process.argv);

program.on("--help", function() {
    console.log("");
    console.log("Example:");
    console.log("");
    console.log("> bone owner/name --dist ");
    console.log("> bone github:owner/name");
    console.log("> bone gitlab:owner/name");
    console.log("> bone bitbucket:owner/name");
});

if (!program.args.length) program.help();

function loading(spinner, message = "Loading") {
    let i = 0;
    let interval = setInterval(() => {
        const frames = spinner.frames;
        logUpdate(frames[(i = ++i % frames.length)] + " " + message);
    }, spinner.interval);
    return () => clearInterval(interval);
}
