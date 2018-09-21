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
    .version("0.1.7")
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
            log = loading(spinners.dots, "Preparing template folder");
        if (remove) {
            lstat(source)
                .then(() => removedir(source))
                .then(() => log.clear(`\n${env} it has been removed`));
            return;
        }

        let pipe = lstat(source),
            load = () => {
                log.update(`${env} downloading resource`);
                return download(env, source);
            };

        if (!clone) {
            if (update) {
                log.update(`\n${env} delete local copy`);
                pipe = pipe
                    .then(() => removedir(source))
                    .then(() => log.update(`\n${env} it has been removed`))
                    .then(load);
            } else {
                pipe = pipe.catch(load);
            }
        }

        pipe.catch(() => {
            log.clear(`\n${env} resource does not exist`);
            return Promise.reject();
        })
            .then(() => {
                let sourceConfig = path.join(source, config);
                return lstat(sourceConfig)
                    .then(() => script(sourceConfig))
                    .catch(() => {});
            })
            .then(load => {
                log.clear();
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
                let folder = path.join(dist, data.$dist || ""),
                    handler = () => {
                        console.log(
                            `Process completed, check the folder: ${folder}`
                        );
                    };
                return template(
                    path.join(source, data.$source || ""),
                    path.resolve(process.cwd(), folder),
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
    return {
        clear(nextMessage = "") {
            clearInterval(interval);
            logUpdate(nextMessage);
        },
        update(nextMessage) {
            message = nextMessage;
        }
    };
}
