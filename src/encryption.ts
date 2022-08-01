import * as yup from "yup"
import {webFormSchema} from "./schema/webform-schema"
import {defaultClientInfo, roundForTime} from "./drand/drand-client"
import {timelockDecrypt, timelockEncrypt} from "./drand/timelock"

export type CompletedWebForm = yup.InferType<typeof webFormSchema>

export async function encryptedOrDecryptedFormData(form: unknown): Promise<CompletedWebForm> {
    const partialWebForm = await webFormSchema.validate(form)

    if (partialWebForm.plaintext) {
        return encrypt(partialWebForm.plaintext, partialWebForm.decryptionTime)

    } else if (partialWebForm.ciphertext) {
        return decrypt(partialWebForm.ciphertext, partialWebForm.decryptionTime)
    }

    return Promise.reject("Neither plaintext nor partialtext were input")
}

async function encrypt(plaintext: string, decryptionTime: number): Promise<CompletedWebForm> {
    const roundNumber = roundForTime(decryptionTime, defaultClientInfo)
    return {
        plaintext,
        decryptionTime,
        ciphertext: await timelockEncrypt(defaultClientInfo, roundNumber, plaintext)
    }
}

async function decrypt(ciphertext: string, decryptionTime: number): Promise<CompletedWebForm> {
    const plaintext = await timelockDecrypt(ciphertext)
    return {
        plaintext,
        decryptionTime,
        ciphertext,
    }
}
