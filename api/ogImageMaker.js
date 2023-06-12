'use strict';
let ndiigboUrl = `https://ndiigbo.com.ng/`;

module.exports.index = async (event, context, callback) => {
    let postId = req.query.postId;

	axios
    .get(`${ndiigboUrl}api/getPost/${postId}`) //url to ndiigbo 
    .then(async resp => {
        // get the details of the post
		let profileImg = resp.data.posted_by.profilePicUrl + "&access_token=" + resp.data.posted_by.fb_token;
		let profileName = resp.data.posted_by.firstname+' '+resp.data.posted_by.lastname; 
		let postDate = moment(resp.data.created_at).format("MMMM Do YYYY, h:mm:ss a");
		let appLogo = `${ndiigboUrl}/img/ndigboIcon50.png`; 
		let postEng = resp.data.postEng;
		let postTargetLang = resp.data.postIgbo;	

		try {
			// render templte
			const compiledHTML = getCompiledHTML(profileImg, profileName, postDate, appLogo, postEng, postTargetLang);
			// generate and store image
			const image = await generateImage({
				content: compiledHTML,
				postId
			});
			
			if(image == 200){
				res.status(200).send('Success');
			}
			
		} catch(e) {
			console.log(e);
			res.status(500).send('Internal Server Error!')
		}
    })
    .catch((err) => {
        console.log(err);
    });


    async function generateImage({ content, postId }) {
        try {
            const browser = await puppeteer.launch({
                headless: true,
                args: ["--no-sandbox"],
                defaultViewport: {
                    width: DEFAULT_WIDTH,
                    height: DEFAULT_HEIGHT,
                }
            });
            const page = await browser.newPage();
            
            // Set the content to our rendered HTML
            await page.setContent(content, { waitUntil: "domcontentloaded" });
            // Wait until all images and fonts have loaded
            await page.evaluate(async () => {
                const selectors = Array.from(document.querySelectorAll("img"));
                await Promise.all([document.fonts.ready, ...selectors.map((img) => {
                        // Image has already finished loading, let’s see if it worked
                        if (img.complete) {
                            // Image loaded and has presence
                            if (img.naturalHeight !== 0) return;
                            // Image failed, so it has no height
                            throw new Error("Image failed to load");
                        }
                        // Image hasn’t loaded yet, added an event listener to know when it does
                        return new Promise((resolve, reject) => {
                            img.addEventListener("load", resolve);
                            img.addEventListener("error", reject);
                        });
                    }),
                ]);
            });
            
            await page.screenshot({path: `ndiigboImage${postId}.png`});
            // const element = await page.$('#body');
            // const image = await element.screenshot({ omitBackground: true });
            
            await browser.close();
    
            return 200;
        } catch(e) {
            console.log(e);
            return null;
        }
    };
    
    function getCompiledHTML(profileImg, profileName, postDate, appLogo, postEng, PostTargetLang) {
        return Handlebars.compile(templateHTML)({
          profileImg, profileName, postDate, appLogo, postEng, PostTargetLang
        });
    }
    
    // Template
    const templateHTML = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
                @font-face {
                    font-family: Source Code Pro;
                    src: url(https://fonts.googleapis.com/css2?family=Source+Code+Pro:wght@500&display=swap);
                }
            
                :root {
                    font-family: Source Code Pro, monospace;
                }
                
                body {
                    margin: 0;
                    background-color: beige;
                }
                main {           
                    width: 860px;
                    padding: 7.5vh 4vw;
                    background-color: white;
                    margin: 0 auto;
                }
                .row {
                    display: flex;
                
                }
                .profileRow {
                    
                    width: 100%;
                }
                .profileImage {
                    width: 13%;
                }
                .appLogo {
                    width: 10%;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: flex-end;
                }
                .appLogo img {
                    width: 6vh;
                }
                .profileImage img {
                    height: 12vh;            
                }
                .circle {
                    border-radius: 50%;
                }
                .profileDetails {
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    width: 77%;
                }
                .profileName {
                    font-weight: 600;
                    font-size: 1.7rem;
                    display: block;
                }
                .postDate {
                    font-size: 1rem;
                    color: grey;
                }
                .postRow {
                    font-size: 1.8rem;
                    margin-top: 7vh;
                }
                .sourceLang {
                    padding-right: 1.2%;
                }
                .targetLang {
                    padding-left: 2%;
                    border-left: thin solid rgb(205, 203, 203);
                }
                .urlRow {
                    margin-top: 3vh;
                }
                .urlRow p {
                    width: 100%;
                }
                .centerAlign {
                    text-align: center;
                }
            </style>
        </head>
        <body>
            <main>
                <div class="row profileRow">
                    <div class="profileImage">
                        <img src="{{profileImg}}" class="circle">
                    </div>
                    <div class="profileDetails">
                        <span class="profileName">{{profileName}}</span>
                        <span class="postDate">{{postDate}}</span>
                    </div>
                    <div class="appLogo">
                        <img src="{{appLogo}}" alt="">
                    </div>
                </div>
                <div class="row postRow">
                    <div class="sourceLang">
                        {{{PostTargetLang}}}
                    </div>
                    <div class="targetLang">
                        {{{postEng}}}
                    </div>
                </div>
                <div class="row urlRow">
                    <p class="centerAlign">https://ndiigbo.io</p>
                </div>
            </main>
        </body>
        </html>
    `;
};