// Typescript / Javascript
/*
   Typescsript code for occurrence comparison using the template matching algorithm.
   It detects if an image is contained in another image (called the template).
   The image must have the same scale and look the same. However, you can add a scaling transformation beforehand.

   official doc:
   https://github.com/appium/appium/blob/master/docs/en/writing-running-appium/image-comparison.md
   OpenCV algorithm doc:
   https://docs.opencv.org/2.4/doc/tutorials/imgproc/histograms/template_matching/template_matching.html
   official sample code:
   https://github.com/justadudewhohacks/opencv4nodejs/blob/master/examples/templateMatching.js

   You must install opencv4nodejs using the -g option.

   The Javascript client driver webdriverio does not support (in January 2020) the "-image" strategy implemented in the Appium server. You will have more power and understanding while using openCV directly. Since the appium server is in Javascript, you can do all it does with opencv in your test suite.

   The testing framework mocha can be run with typescript to have async/await.
   You need to run mocha with those options in the right order and with the associated packages installed:
   NODE_PATH=/path/to/nodejs/lig/node_modules TS_NODE_PROJECT=config/tsconfig_test.json --require ts-node/register --require tsconfig-paths/register
   You will also need to make a basic config/tsconfig_test.json
   Note that paths in tsconfig.json does not support absolute paths. Hence, you cannot move the NODE_PATH there.
*/
const path = require('path');
const cv = require('opencv4nodejs');

const isImagePresent = async () => {
    const driver = wd.promiseChainRemote("http://localhost:4723/wd/hub");
    const caps = {
        "platformName": "Android",
        "platformVersion": "11",
        "udid": "emulator-5554",
        "automationName": "UiAutomator2",
        "browserName": "",
        "appPackage": "com.google.android.youtube",
        "appActivity": "com.google.android.youtube.HomeActivity",
        "ensureWebviewsHavePages": true
    };

    await driver.init(caps);

    /// Take screenshot and read the image
    const screenImagePath = './appium_screenshot1.png';
    await driver.saveScreenshot(screenImagePath)
    const likedImagePath = './occurrence1.png';

    // Load images
    const originalMatPromise = cv.imreadAsync(screenImagePath);
    const waldoMatPromise = cv.imreadAsync(likedImagePath);
    const [originalMat, waldoMat] = await Promise.all([originalMatPromise, waldoMatPromise]);

    // Match template (the brightest locations indicate the highest match)
    // In the OpenCV doc, the option 5 refers to the algorithm called CV_TM_CCOEFF_NORMED
    const matched = originalMat.matchTemplate(waldoMat, 5);

    // Use minMaxLoc to locate the highest value (or lower, depending of the type of matching method)
    const minMax = matched.minMaxLoc();
    const { maxLoc: { x, y } } = minMax;

    // Draw bounding rectangle
    originalMat.drawRectangle(
        new cv.Rect(x, y, waldoMat.cols, waldoMat.rows),
        new cv.Vec(0, 255, 0),
        2,
        cv.LINE_8
    );

    // Open result in new window
    // If the image is too big for your screen, you need to write to a file instead.
    // Check the source of opencv4nodejs for writing an image to a file.
    cv.imshow('We\'ve found Waldo!', originalMat);
    await cv.waitKey();

    // then you know if the image was found by comparing the rectangle with a reference rectangle.
    // the structure minMax contains the property maxVal that gives the quality of the match
    // 1 is prefect match, but you may get .999. If you extract an image from the screenshot manually,
    // you will get an image that matches.
};

isImagePresent()