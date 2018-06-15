/**
 * Copyright (c) Microsoft Corporation. All rights reserved.  
 * Licensed under the MIT License.
 */
import * as fs from 'fs'
import * as path from 'path'
import { Template, TemplateVariable, RenderedActionArgument } from '@conversationlearner/models'
import { CLDebug } from './CLDebug'

export class TemplateProvider {
    private static hasSubmitError = false

    // TODO: Decouple template renderer from types from Action classes
    // E.g. use generic key,value object instead of RenderedActionArgument
    public static async RenderTemplate(templateName: string, templateArguments: RenderedActionArgument[]): Promise<any | null> {
        let template = this.GetTemplate(templateName)
        if (template === null) {
            return null
        }

        let templateString = JSON.stringify(template)
        let argumentNames = this.GetArgumentNames(templateString)

        // Substitute argument values
        for (let argumentName of argumentNames) {
            let renderedActionArgument = templateArguments.find(a => a.parameter == argumentName)
            if (renderedActionArgument) {
                templateString = templateString.replace(new RegExp(`{{${argumentName}}}`, 'g'), renderedActionArgument.value || '')
            }
        }
        templateString = this.RemoveEmptyArguments(templateString)
        return JSON.parse(templateString)
    }

    public static GetTemplates(): Template[] {
        let templates: Template[] = []
        let files = this.GetTemplatesNames()
        for (let file of files) {
            let fileContent = this.GetTemplate(file)

            // Clear submit check (will the set by extracting template variables)
            this.hasSubmitError = false
            let tvs = this.UniqueTemplateVariables(fileContent)

            // Make sure template has submit item
            let validationError = this.hasSubmitError
                ? `Template "${file}" has an "Action.Submit" item but no submit data.  Submit item must be of the form: "type": "Action.Submit", "data": { "submit": "{SUBMIT PAYLOAD"}` : null

            let templateBody = JSON.stringify(fileContent)
            let template: Template = {
                name: file,
                variables: tvs,
                body: templateBody,
                validationError: validationError
            }
            templates.push(template)
        }

        return templates
    }

    private static UniqueTemplateVariables(template: any): TemplateVariable[] {
        // Get all template variables
        let templateVariables = this.GetTemplateVariables(template)

        // Make entries unique, and use verion with existing type
        let unique = []
        for (let tv of templateVariables) {
            let existing = unique.find(i => i.key == tv.key)
            if (existing) {
                if (existing.type != null && tv.type != null && existing.type != tv.type) {
                    CLDebug.Error(
                        `Template variable "${tv.key}" used for two diffent types - "${tv.type}" and "${existing.type}".  Ignoring.`
                    )
                } else {
                    existing.type = existing.type || tv.type
                }
            } else {
                unique.push(tv)
            }
        }
        return unique
    }

    public static RemoveEmptyArguments(formString: string) {
        return formString.replace(/{{\s*[\w\.]+\s*}}/g, '')
    }

    public static GetArgumentNames(formString: string) {
        // Get set of unique entities
        let mustaches = formString.match(/{{\s*[\w\.]+\s*}}/g)
        if (mustaches) {
            let entities = [...new Set(mustaches.map(x => x.match(/[\w\.]+/)![0]))]
            return entities
        }
        return []
    }

    public static TemplateDirectory(): string {
        //TODO - make this configurable
        let templateDirectory = path.join(process.cwd(), './cards')

        // Try up a directory or two as could be in /lib or /dist folder depending on deployment
        if (!fs.existsSync(templateDirectory)) {
            templateDirectory = path.join(process.cwd(), '../cards')
        }
        if (!fs.existsSync(templateDirectory)) {
            templateDirectory = path.join(process.cwd(), '../../cards')
        }
        return templateDirectory;
    }

    public static GetTemplate(templateName: string): any {

        const filename = path.join(this.TemplateDirectory(), `${templateName}.json`);
        
        try {
            const templateString = fs.readFileSync(filename, 'utf-8')

            try {
                const template = JSON.parse(templateString)
                return template
            } catch {
                CLDebug.Error(`Invalid JSON: Failed to Parse template named "${templateName}"`)
                return null
            }

        } catch {
            CLDebug.Error(`Can't find template named: "${filename}"`)
        }
    }

    public static GetTemplatesNames(): string[] {
        try {
            let fileNames: string[] = fs.readdirSync(this.TemplateDirectory())
            fileNames = fileNames.filter(fn => fn.endsWith('.json'))
            let templates = fileNames.map(f => f.slice(0, f.lastIndexOf('.')))
            return templates
        } catch {
            CLDebug.Log("No Card directory found")
            return [];
        }
    }

    private static GetVarNames(template: any): string[] {
        let mustaches: string[] = []
        for (let i in template) {
            if (typeof template[i] != 'object') {
                let searchStr = JSON.stringify(template[i])
                let results = searchStr.match(/{{\s*[\w\.]+\s*}}/g)
                if (results) {
                    mustaches = mustaches.concat(results.map(x => x.match(/[\w\.]+/)![0]))
                }
            }
        }
        return mustaches
    }

    private static GetTemplateVariables(template: any): TemplateVariable[] {
        let tvs: TemplateVariable[] = []
        if (template && template.type === "Action.Submit" && (!template.data || !template.data.submit)) {
            this.hasSubmitError = true
        }

        // Get variable names
        let vars = this.GetVarNames(template)
        if (vars.length > 0) {
            for (let key of vars) {
                let tv: TemplateVariable = { key: key, type: template['type'] }
                tvs.push(tv)
            }
        }

        // Iterate through keys
        for (let i in template) {
            if (!template.hasOwnProperty(i)) {
                continue
            }
            if (template[i] instanceof Array) {
                for (let item of template[i]) {
                    tvs = tvs.concat(this.GetTemplateVariables(item))
                }
            } else if (typeof template[i] == 'object') {
                tvs = tvs.concat(this.GetTemplateVariables(template[i]))
            }
        }

        return tvs
    }
}
