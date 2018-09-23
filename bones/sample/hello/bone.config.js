export default {
    description: "Hi!, we will create your folder but before some questions...",
    questions: [
        /**
         * Check!, for more questions https://github.com/terkelg/prompts
         */
        {
            type: "text",
            name: "name",
            message: "Write a name for your folder"
        },
        {
            type: "select",
            name: "hello",
            message: "Select a greeting",
            choices: [
                { title: "Hi! bone 🤟", value: "Hi! bone 🤟" },
                { title: "I'm bone 📦", value: "I'm bone 📦" },
                { title: "💡 Bone bone bone...", value: "💡 Bone bone bone..." }
            ],
            initial: 0
        }
    ],
    onSubmit(data) {
        data.folder = "folder";
        data.file = "file";
        data.$dist = data.name = data.name.replace(/[^\w]+/g, "-");
        return data;
    }
};
