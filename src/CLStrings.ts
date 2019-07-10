/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
export enum CLStrings {
    API_MISSING_ENTITY = "API references Entity that doesn't exist in this Model:",
    ENTITYCALLBACK_EXCEPTION = "Error in Bot's EntityDetectionCallback: ",
    MEMORY_MANAGER_VALUE_LIST_EXCEPTION = "Entity is multi-value. Use AS_VALUE_LIST",
    MEMORY_MANAGER_NUMBER_LIST_EXCEPTION = "Entity is multi-value. Use AS_NUMBER_LIST",
    MEMORY_MANAGER_BOOLEAN_LIST_EXCEPTION = "Entity is multi-value. Use AS_BOOLEAN_LIST",
    MEMORY_MANAGER_INVALID_ENUM_EXCEPTION1 = " is an ENUM Entity. Provided value (",
    MEMORY_MANAGER_INVALID_ENUM_EXCEPTION2 = ") is not one of the enum values of this Entity: ",
    MEMORY_MANAGER_NOT_A_NUMBER_EXCEPTION = "Memory Value is not a number",
    MEMORY_MANAGER_NOT_A_STRING_EXCEPTION = "Memory Value is not a string",
    MEMORY_MANAGER_NOT_A_BOOLEAN_EXCEPTION = "Memory Value is not a boolean",
    MEMORY_MANAGER_PRETRAINED_EXCEPTION = "Not allowed to set values of pre-trained Entities:",
    MEMORY_MANAGER_EXPIRED_EXCEPTION = "called after your function has already returned. You must await results within your code rather than use callbacks",
    EXCEPTION_API_CALLBACK = "Exception hit in Bot's API Callback: ",
    MALFORMED_API_CALLBACK = "Malformed API Callback: ",
    EXCEPTION_ONSESSIONSTART_CALLBACK = "Exception hit in Bot's OnSessionStartCallback"
}