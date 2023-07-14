# shield

Shield empowers content creators, platform administrators, and users to take control of their online audio experiences.

## Installation

```bash
npm install
```

```python

# Build the project
npm run build

# Run the project
npm run start
```

## Usage

1. Upload Audio file (Music, Podcast etc)

#### Successful Curl Request

``` sh 
curl --location 'http://localhost:3000/api/audio/upload' \
--form 'audioFile=@"/C:/Users/User/Documents/A one minute TEDx Talk for the digital age  Woody Roseland  TEDxMileHigh.mp3"'
```

#### Successful Response

```yaml
{
    "success": true,
    "message": "Audio file upload was successful",
    "data": {
        "location": "https://audioshield.s3.amazonaws.com/c6zl4d_1686741351650.mp3",
        "key": "c6zl4d_1686741351650.mp3",
        "bucket": "audioshield",
        "etag": "\"977b17d6ffe019eb7aeb616754cf32e2\""
    }
}
```

2. Transcribe Uploaded Audio
- Using Amazon Transcribe:

#### Successful Curl Request

```sh 
curl --location 'http://localhost:3000/api/audio/transcribe' \
--header 'Content-Type: application/json' \
--data '{
    "audioUrl":"https://audioshield.s3.amazonaws.com/jjl2xu_1686738026037.mp3"
}'
```

#### Successful Response

```yaml
{
    "success": true,
    "message": "Transcription job started successfully",
    "data": {
        "transcriptionJobName": {
            "TranscriptionJob": {
                "TranscriptionJobName": "jjl2xu_1686738026037.mp3",
                "TranscriptionJobStatus": "IN_PROGRESS",
                "LanguageCode": "en-US",
                "Media": {
                    "MediaFileUri": "s3://audioshield/jjl2xu_1686738026037.mp3"
                },
                "StartTime": "2023-06-14T10:20:43.469Z",
                "CreationTime": "2023-06-14T10:20:43.447Z"
            }
        }
    }
}
```

3. Get Transcribe Job Details

#### Successful Curl Request

```sh 
curl --location --request GET 'http://localhost:3000/api/audio/analyze' \
--header 'Content-Type: application/json' \
--data '{
    "jobKey":"jjl2xu_1686738026037.mp3.json"
}'
```

#### Successful Response

```yaml
{
    "success": true,
    "message": "Transcription job details retrieved successfully",
    "data": {
        "jobName": "jjl2xu_1686738026037.mp3",
        "accountId": "33309XXXX204",
        "results": {
            "transcripts": [
                {
                    "transcript": "Wow. What an audience. But if I'm being honest, I don't care what you think of my talk. I don't, I care what the internet thinks in my talk because they're the ones who get it seen and get it shared. And I think that's where most people get it wrong. They're talking to you here instead of talking to you. Random person scrolling. Facebook. Thanks for the click. You see back in 2009, we all had these weird little things called attention spans. Yeah, they're gone, they're gone. We killed them. They're dead. I'm trying to think of the last time I watched an 18 minute TED talk. It's been years, literally years. So, if you're given a TED talk, keep it quick, I'm doing mine in under a minute. I'm at 44 seconds right now. That means we got time for one final joke. Why are balloons so expensive? Inflation?"
                }
            ],
            "items": [
                {
                    "start_time": "11.56",
                    "end_time": "12.409",
                    "alternatives": [
                        {
                            "confidence": "0.996",
                            "content": "Wow"
                        }
                    ],
                    "type": "pronunciation"
                },
                {
                    "alternatives": [
                        {
                            "confidence": "0.0",
                            "content": "?"
                        }
                    ],
                    "type": "punctuation"
                }
            ]
        },
        "status": "COMPLETED"
    }
}
```

4. Get Comprehend Job Details

#### Successful Curl Request

``` sh 
curl --location --request GET 'http://localhost:3000/api/audio/comprehend' \
--header 'Content-Type: application/json' \
--data '{
    "jobKey":"5bgck1_1686830588899.mp3.txt"
}'
```

#### Successful Response

```yaml
{
    "success": true,
    "message": "Comprehend job details retrieved successfully",
    "data": {
        "sentiment": "NEGATIVE",
        "keyPhrases": [
            {
                "Score": 0.9592595100402832,
                "Text": "an audience",
                "BeginOffset": 10,
                "EndOffset": 21
            },
            {
                "Score": 0.9999693036079407,
                "Text": "my talk",
                "BeginOffset": 79,
                "EndOffset": 86
            }
        ],
        "isProfane": false
    }
}
```

5. Upload YouTube URL 

#### Successful Curl Request

``` sh 
curl --location 'http://localhost:3000/api/audio/upload/url' \
--header 'Content-Type: application/json' \
--data '{
    "audioUrl":"https://www.youtube.com/watch?v=fLeJJPxua3E"
}'
```

#### Successful Response

```yaml
{
    "success": true,
    "message": "Transcription job started successfully",
    "data": {
        "TranscriptionJob": {
            "TranscriptionJobName": "fLeJJPxua3E",
            "TranscriptionJobStatus": "IN_PROGRESS",
            "LanguageCode": "en-US",
            "Media": {
                "MediaFileUri": "s3://audioshield/fLeJJPxua3E.mp3"
            },
            "StartTime": "2023-06-15T12:38:53.756Z",
            "CreationTime": "2023-06-15T12:38:53.736Z"
        }
    }
}
```

## Language To Support
[en-IE, ar-AE, te-IN, zh-TW, en-US, ta-IN, en-AB, en-IN, zh-CN, ar-SA, en-ZA, gd-GB, th-TH, tr-TR, ru-RU, pt-PT, nl-NL, it-IT, id-ID, fr-FR, es-ES, de-DE, ga-IE, af-ZA, en-NZ, ko-KR, hi-IN, de-CH, vi-VN, cy-GB, ms-MY, he-IL, da-DK, en-AU, pt-BR, en-WL, fa-IR, sv-SE, ja-JP, es-US, fr-CA, en-GB]


## Contributing

Pull requests are welcome. For major changes, please open an issue first
to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[MIT](https://choosealicense.com/licenses/mit/)
