import { S3 } from 'aws-sdk';
import { Request, Response } from 'express';

import { saveAudioToStorage, transcribeAudioFromS3, getTranscribeJobDetails, getComphrehendScore, saveAudioFromURL } from '../services/audioService';
import { ACCESSKEYID, AWS_REGION, BUCKET_NAME, SECRETACCESSKEY } from '../utils/constant';

export async function uploadAudio(req: Request, res: Response) {
    const s3 = new S3({
        accessKeyId: ACCESSKEYID,
        secretAccessKey: SECRETACCESSKEY,
        region: AWS_REGION
    });

    try {
        console.log("Audio file object", req.file);
        const uploadRes = await saveAudioToStorage(s3, req.file);

        if (uploadRes.success) {
            const audioLocation = uploadRes.data as { location: string };
            const languageCode = "en-US";

            const transcriptionJobName = await transcribeAudioFromS3(BUCKET_NAME, audioLocation.location, languageCode);

            if (transcriptionJobName && transcriptionJobName.TranscriptionJob) {
                res.status(200).json({
                    success: true,
                    message: "Transcription job started successfully",
                    data: {
                        transcriptionJobName
                    }
                });
            } else {
                res.status(400).json({
                    success: false,
                    message: "Failed to start transcription job",
                    data: {}
                });
            }
        } else {
            res.status(400).json({
                success: false,
                message: "Failed to upload the audio file",
                data: {}
            });
        }
    } catch (error) {
        console.error("Error uploading audio:", error);
        res.status(500).json({
            success: false,
            message: "Internal server error",
            data: {}
        });
    }
}

export async function uploadURL(req: Request, res: Response) {
    const s3 = new S3({
        accessKeyId: ACCESSKEYID,
        secretAccessKey: SECRETACCESSKEY,
        region: AWS_REGION
    });

    try {
        const { audioUrl } = req.body;

        const uploadRes = await saveAudioFromURL(s3, audioUrl);

        if (uploadRes.TranscriptionJob && uploadRes.TranscriptionJob.TranscriptionJobStatus === 'IN_PROGRESS') {
            const languageCode = "en-US";

            const response = {
                success: true,
                message: 'Transcription job started successfully',
                data: {
                    transcriptionJobName: {
                        TranscriptionJob: {
                            TranscriptionJobName: uploadRes.TranscriptionJob.TranscriptionJobName,
                            TranscriptionJobStatus: uploadRes.TranscriptionJob.TranscriptionJobStatus,
                            LanguageCode: languageCode,
                            Media: {
                                MediaFileUri: uploadRes.TranscriptionJob.Media?.MediaFileUri ?? ''
                            },
                            StartTime: uploadRes.TranscriptionJob.StartTime,
                            CreationTime: uploadRes.TranscriptionJob.CreationTime
                        }
                    }
                }
            };

            res.status(200).json(response);
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to start transcription job',
                data: uploadRes
            });
        }
    } catch (error) {
        console.error('Error saving audio from URL:', error);
        res.status(400).json({
            success: false,
            message: 'Failed to save audio from URL',
            error: error
        });
    }
}

export async function transcribeJobDetails(req: Request, res: Response) {
    const s3 = new S3({
        accessKeyId: ACCESSKEYID,
        secretAccessKey: SECRETACCESSKEY,
        region: AWS_REGION
    })

    try {
        const jobKey = req.query.jobKey as string; // Extract the jobKey from the query parameter

        const jobDetails = await getTranscribeJobDetails(s3, jobKey);

        res.status(200).json({
            success: true,
            message: 'Transcription job details retrieved successfully',
            data: jobDetails,
        });
    } catch (error) {
        console.error('Error retrieving transcription job details:', error);
        res.status(400).json({
            success: false,
            message: 'Failed to retrieve transcription job details',
            data: error,
        });
    }
}

export async function comprehendDetails(req: Request, res: Response) {
    const s3 = new S3({
        accessKeyId: ACCESSKEYID,
        secretAccessKey: SECRETACCESSKEY,
        region: AWS_REGION,
    });

    try {
        const jobKey = req.query.jobKey as string; // Extract the jobKey from the query parameter

        const jobDetails = await getComphrehendScore(s3, jobKey);

        res.status(200).json({
            success: true,
            message: 'Comprehend job details retrieved successfully',
            data: jobDetails,
        });
    } catch (error) {
        console.error('Error retrieving comprehend job details:', error);
        res.status(400).json({
            success: false,
            message: 'Failed to retrieve comprehend job details',
            data: error,
        });
    }
}
