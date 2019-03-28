/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
/**
 * @module botbuilder-node
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { Storage, StoreItems, StoreItem } from 'botbuilder';
import * as path from 'path';
import * as fs from 'async-file';
import * as file from 'fs';
import * as filenamify from 'filenamify';

/**
 * :package: **botbuilder**
 *
 * A file based storage provider. Items will be persisted to a folder on disk.
 *
 * **Usage Example**
 *
 * ```JavaScript
 * const { FileStorage } = require('botbuilder');
 * const path = require('path');
 *
 * const storage = new FileStorage(path.join(__dirname, './state'));
 * ```
 */
export class FileStorage implements Storage {
    static nextTag = 0;
    private pEnsureFolder: Promise<void> | undefined
    protected readonly path: string
    /**
     * Creates a new FileStorage instance.
     * @param path Root filesystem path for where the provider should store its items.
     */
    public constructor(filePath: string) {
        this.path = filePath
    }

    public async read(keys: string[]): Promise<StoreItems> {
        await this.ensureFolder();
        const data: StoreItems = {};
        const promises: Promise<any>[] = keys.map(async key => {
            const filePath = this.getFilePath(key);
            const obj = await parseFile(filePath)
            if (obj) {
                data[key] = obj;
            }
        })

        await Promise.all(promises)
        return data;
    }

    public async write(changes: StoreItems): Promise<void> {
        await this.ensureFolder()
        const promises: Promise<void>[] = Object.keys(changes).map(async key => {
            const filePath = this.getFilePath(key)
            await fs.exists(filePath)
            const newObj: StoreItem = { ...changes[key] }
            newObj.eTag = (parseInt(newObj.eTag || '0', 10) + 1).toString()
            return fs.writeTextFile(filePath, JSON.stringify(newObj))
        })

        await Promise.all(promises)
    }

    public async delete(keys: string[]): Promise<void> {
        await this.ensureFolder()
        const promises = Object.keys(keys).map(async key => {
            const filePath = this.getFilePath(key)
            const exists = await fs.exists(filePath)
            if (exists) {
                file.unlinkSync(filePath);
            }
        })
        await Promise.all(promises)
    }

    private async ensureFolder(): Promise<void> {
        if (this.pEnsureFolder) {
            return this.pEnsureFolder;
        }

        const exists = await fs.exists(this.path)
        if (!exists) {
            this.pEnsureFolder = fs.mkdirp(this.path)
        }
    }

    private getFileName(key: string): string {
        return filenamify(key);
    }

    private getFilePath(key: string): string {
        return path.join(this.path, this.getFileName(key));
    }
}

async function parseFile(filePath: string): Promise<Object | undefined> {
    try {
        const exists = await fs.exists(filePath)
        const data = await (exists
            ? fs.readTextFile(filePath)
            : Promise.resolve(undefined))
        try {
            if (data) {
                return JSON.parse(data)
            }
        }
        catch (err) {
            console.warn(`FileStorage: error parsing "${filePath}": ${err.toString()}`)
        }

        return undefined
    }
    catch (error) {
        // File could legitimately have been deleted
        if (error.code != "ENOENT") {
            console.warn(`FileStorage: error reading "${filePath}": ${error.toString()}`)
        }
        return undefined
    }
}
