import { Comprehend, S3, TranscribeService } from 'aws-sdk';
import fs from 'fs';
import ytdl from 'ytdl-core';
import { ACCESSKEYID, AWS_REGION, BUCKET_NAME, SECRETACCESSKEY } from "../utils/constant";

export async function saveAudioToStorage(s3: S3, audioFile?: Express.Multer.File) {
    try {
        const fileContent = fs.readFileSync(audioFile!.path);
        const fileType = audioFile!.mimetype;

        if (fileType.startsWith('image/') ||
            fileType.startsWith('application/pdf') ||
            fileType === 'text/plain') {
            return {
                success: false,
                message: "Image or document files are not allowed",
                data: {},
            };
        }

        const uploadParams: S3.PutObjectRequest = {
            Bucket: BUCKET_NAME,
            Key: generateKey(audioFile!.originalname),
            Body: fileContent,
        };

        try {
            const res = await s3.upload(uploadParams).promise();
            console.log("File Uploaded with Success:", res);

            return {
                success: true,
                message: "Audio file upload was successful",
                data: {
                    location: res.Location,
                    key: res.Key,
                    bucket: res.Bucket,
                    etag: res.ETag,
                },
            };
        } catch (error) {
            return {
                success: false,
                message: "Failed to upload the audio file",
                data: error,
            };
        }
    } catch (error) {
        return {
            success: false,
            message: "Unable to access the audio file",
            data: {},
        };
    }
}

export async function transcribeAudioFromS3(bucketName: string, audioUrl: string, languageCode: string) {
    const transcribeService = new TranscribeService({ region: AWS_REGION, accessKeyId: ACCESSKEYID, secretAccessKey: SECRETACCESSKEY });

    const urlParts = audioUrl.split('/');
    const audioKey = urlParts[urlParts.length - 1];
    console.log(audioKey)
    const transcriptionJobName = audioKey;
    const mediaFileUri = `s3://${bucketName}/${audioKey}`;

    console.log(mediaFileUri)

    const transcribeParams: TranscribeService.StartTranscriptionJobRequest = {
        TranscriptionJobName: transcriptionJobName,
        LanguageCode: languageCode,
        Media: {
            MediaFileUri: mediaFileUri
        },
        OutputBucketName: bucketName
    };

    try {
        const response = await transcribeService.startTranscriptionJob(transcribeParams).promise();
        console.log('Transcription job started successfully:', response);
        return response;
    } catch (error) {
        console.error('Error starting transcription job:', error);
        throw error;
    }
}

//save Youtube Video to AWS S3
export async function saveAudioFromURL(s3: S3, audioUrl: string) {

    const transcribeService = new TranscribeService({ region: AWS_REGION, accessKeyId: ACCESSKEYID, secretAccessKey: SECRETACCESSKEY });

    try {
        const videoInfo = await ytdl.getInfo(audioUrl);
        const audioFormat = ytdl.chooseFormat(videoInfo.formats, { quality: 'highestaudio' });
        const audioStream = ytdl(audioUrl, { format: audioFormat });
        const transcriptionJobName = videoInfo.videoDetails.videoId;
        const mediaFileUri = `s3://${BUCKET_NAME}/${transcriptionJobName}.mp3`;

        const uploadParams: S3.PutObjectRequest = {
            Bucket: BUCKET_NAME,
            Key: `${transcriptionJobName}.mp3`,
            Body: audioStream,
            ContentType: 'audio/mpeg'
        };

        await s3.upload(uploadParams).promise();

        const transcribeParams: TranscribeService.StartTranscriptionJobRequest = {
            TranscriptionJobName: transcriptionJobName+".mp3",
            LanguageCode: "en-US",
            Media: {
                MediaFileUri: mediaFileUri
            },
            OutputBucketName: BUCKET_NAME
        };

        const response = await transcribeService.startTranscriptionJob(transcribeParams).promise();
        console.log('Transcription job started successfully:', response);
        return response;
    } catch (error) {
        console.error('Error starting transcription job:', error);
        throw error;
    }

}

export async function getTranscribeJobDetails(s3: S3, jobKey: string) {
    try {
        const params: S3.GetObjectRequest = {
            Bucket: BUCKET_NAME,
            Key: jobKey,
        };

        const response = await s3.getObject(params).promise();
        const jobDetails = JSON.parse(response.Body?.toString() || "");

        // Save transcribe text as a TXT file
        const text = jobDetails.results.transcripts[0].transcript;
        const txtKey = `${jobKey.replace(".json", "")}.txt`;

        const uploadParams: S3.PutObjectRequest = {
            Bucket: BUCKET_NAME,
            Key: txtKey,
            Body: text,
        };

        await s3.upload(uploadParams).promise();

        return {
            success: true,
            message: "Transcription job details retrieved successfully",
            data: {
                jobDetails,
                txtKey,
            },
        };
    } catch (error) {
        console.error("Error retrieving transcription job details:", error);
        throw error;
    }
}

export async function getComphrehendScore(s3: S3, jobKey: string) {

    const comprehendService = new Comprehend({ region: AWS_REGION, accessKeyId: ACCESSKEYID, secretAccessKey: SECRETACCESSKEY });

    const params1: S3.GetObjectRequest = {
        Bucket: BUCKET_NAME,
        Key: jobKey
    }

    try {
        const response = await s3.getObject(params1).promise();

        //Get transcription
        const text = response.Body?.toString('utf-8');
        //console.log('Transcription:', text);

        const sentimentParam: Comprehend.DetectSentimentRequest = {
            LanguageCode: 'en',
            Text: text || ''
        };

        const keyPhrasesParam: Comprehend.DetectKeyPhrasesRequest = {
            LanguageCode: 'en',
            Text: text || ''
        }

        const piiEntityParam: Comprehend.DetectPiiEntitiesRequest = {
            LanguageCode: 'en',
            Text: text || ''
        }

        const syntaxParam: Comprehend.DetectSyntaxRequest = {
            LanguageCode: 'en',
            Text: text || ''
        }

        try {
            const sentimentResponse = await comprehendService.detectSentiment(sentimentParam).promise();
            const keyPhrasesResponse = await comprehendService.detectKeyPhrases(keyPhrasesParam).promise();
            const piiEntityResponse = await comprehendService.detectPiiEntities(piiEntityParam).promise();
            const syntaxResponse = await comprehendService.detectSyntax(syntaxParam).promise();
            const badWordsResponse = await isProfane(text)
            console.log("badWordsResponse" + badWordsResponse)

            return {
                sentiment: sentimentResponse.Sentiment,
                keyPhrases: keyPhrasesResponse.KeyPhrases,
                piiEntities: piiEntityResponse.Entities,
                syntax: syntaxResponse.SyntaxTokens,
                isProfane:badWordsResponse
            };
        } catch (error) {
            console.error('Error analyzing transcribed text:', error);
            throw error;
        }

    } catch (error) {
        console.error('Failed detecting sentiment', error);
        throw error;
    }
}


function generateKey(originalName: string): string {
    const dotIndex = originalName.lastIndexOf('.');
    if (dotIndex !== -1) {
        const fileExtension = originalName.substring(dotIndex + 1);
        const timestamp = new Date().getTime();
        const randomChars = Math.random().toString(36).substring(2, 8);
        const fileName = `${randomChars}_${timestamp}.${fileExtension}`;

        return fileName;
    }

    const fallbackExtension = 'txt';
    const timestamp = new Date().getTime();
    const randomChars = Math.random().toString(36).substring(2, 8);
    const fileName = `${randomChars}_${timestamp}.${fallbackExtension}`;

    return fileName;
}

async function isProfane(text: string | undefined) {
    if (!text) {
        throw new Error('No text provided');
    }

    var Filter = require('bad-words'),
    filter = new Filter();

    return filter.isProfane(text);
}
