import fs from 'fs'
// async function loadNodeFs(): Promise<any> {
//     try {
//         return await ;
//     } catch {
//         return await import('fs');
//     }
// }

export class NodeFileUtilAdapter {

    constructor() {
    }

    async exists(path: string): Promise<boolean> {
        return fs.existsSync(path);
    }

    async isFile(path: string): Promise<boolean> {
        try {
            return fs.statSync(path).isFile();
        } catch {
            return false;
        }
    }

    async isDirectory(path: string): Promise<boolean> {
        try {
            return fs.statSync(path).isDirectory();
        } catch {
            return false;
        }
    }

    async readTextFile(path: string): Promise<string> {
        return fs.readFileSync(path, 'utf-8');
    }

    async writeTextFile(filePath: string, content: string): Promise<void> {
        fs.writeFileSync(filePath, content, 'utf-8');
    }

    async mkdirp(path: string): Promise<void> {
        fs.mkdirSync(path, { recursive: true });
    }

    async listDir(path: string): Promise<string[]> {
        return fs.readdirSync(path);
    }
}

let adapter = new NodeFileUtilAdapter();
adapter.writeTextFile('/Users/jaylen/repository/WebstormProjects/test/text.txt', 'haha')
