export async function snake_case(text: string) {
    return await text.replace(/[\w]([A-Z])/g, function (match) {
        return match[0] + "_" + match[1].toLowerCase();
    }).replace(/\s+/g, "_").toLowerCase();
}