// Import the installed modules.
const express = require('express');
const responseTime = require('response-time')
const axios = require('axios');

const multer = require('multer');
const { response } = require('express');
const mkdirp = require('mkdirp-promise');
//const fs = require('fs');
const fs = require('fs-extra');
const path = require('path');
const app = express();
var sortJsonArray = require('sort-json-array');
const archiver = require('archiver');



// use response-time as a middleware
app.use(responseTime());

// fs.mkdir(path.join("./uploads/", 'var'),
//   { recursive: true }, (err) => {
//     if (err) {
//       return console.error(err);
//     }
//     console.log('Directory created successfully!');
//   });

  function makeAllDirs(root, list) {
    return list.reduce((p, item) => {
        return p.then(() => {
            return mkdirp(path.join(root, item));
        });
    }, Promise.resolve());
}

// usage

function between(min, max) {  
  return Math.floor(
    Math.random() * (max - min) + min
  )
}

function createDirectories(dir, subdir){
  randNumber = "RootFolder"+ between(10, 2000);
  let dirs = [
      `${randNumber}/${subdir}/tasks`,
      `${randNumber}/${subdir}/files`,
      `${randNumber}/${subdir}/meta`,
      `${randNumber}/${subdir}/templates`,
     
  ];
  
  
  makeAllDirs(dir, dirs).then(() => {
     // all done here
  }).catch(err => {
     // error here
  });

  return randNumber;
}



const storage = multer.diskStorage({  
    
  destination: (req, file, callBack) => {
      //console.log("loading ------------->", callBack);
     
      callBack(null, `./uploads/temp/`)
  },
  filename: (req, file, callBack) => {
      //console.log("loading ------------->", file.originalname);
      callBack(null, file.originalname);
  }
})

const upload = multer({ storage: storage })

rootFolder="";
//upload File
app.post('/upload/file', upload.single('file'), (req, res, next) => {
  const file = req.file;
  rootFolder = req.body.rootFolder;
  console.log(rootFolder);
  console.log(file.filename);

  fs.move('./uploads/temp/' + file.filename, `./uploads/${rootFolder}/git-master-folder/tasks/`  + file.filename, function (err) {
    if (err) {
        return console.error(err);
    }
    
    //res.json({});
 
  });
  //console.log(file.path);
  //path = file.path;
  if (!file) {
    const error = new Error('No File')
    error.httpStatusCode = 400
    return res.end();
  }
 
  //return res.status(200).json({ source: 'microbot', ...responseJSON, });

  res.send("microbot uploaded "+ file.filename);
 
  //fs.unlink();
   // res.send(file);
})




function appendFiles(rootFolder, seqsort){

  //var files = ["./uploads/git-master-folder/tasks/microbot1.yml", "./uploads/git-master-folder/tasks/microbot2.yml"];
  console.log("seqsorts", seqsort)
 
  
  

  dirPath = `./uploads/${rootFolder}/git-master-folder/tasks/`
  var fileNames = fs.readdirSync(dirPath);
 
  console.log("fileNames", fileNames)
  sorterFileNames = [];
  for (i in seqsort){
    if(fileNames.includes(seqsort[i]))
    console.log("seqsort[i] ", seqsort[i] );
    sorterFileNames.push(seqsort[i])

  }
  console.log("sorterFileNames", sorterFileNames)
  var outStream = fs.createWriteStream(`./uploads/${rootFolder}/git-master-folder/tasks/main.yml`);
  for (file in sorterFileNames){
    console.log("fileName", sorterFileNames[file])
    var k = fs.createReadStream(`./uploads/${rootFolder}/git-master-folder/tasks/`+sorterFileNames[file]);
    k.pipe(outStream);
    

  }

  
  outStream.on('close', function() {
    console.log("done writing");
  });
  
  //r.pipe(outStream);
  
}


function readJson(seqFile){
  const seq = require(seqFile);
seqArr = [];

console.log("json->",seq.microbots[1]);
seqArr = seq.microbots
console.log(seqArr);
appendOrder= []
console.log(sortJsonArray(seqArr, 'seq_no'));
for( i in seqArr  ){
  appendOrder.push(seqArr[i].name)
}
console.log("appendOrder", appendOrder);
return appendOrder
}
//readJson();
app.post('/appendMicroBots', upload.single('reorderJSON') , (req, res, next) => {
  const file = req.file;
  rootFolder = req.body.rootFolder;
  console.log("rootFolder", rootFolder);
  console.log("fileName", file.filename);
  fs.move('./uploads/temp/' + file.filename, `./uploads/${rootFolder}/git-master-folder/files/`  + file.filename, function (err) {
    if (err) {
        return console.error(err);
    }
   
    //res.json({});
    seqFile = `./uploads/${rootFolder}/git-master-folder/files/`  + file.filename
    seqsort = readJson(seqFile);
    appendFiles(rootFolder, seqsort)
    const timeoutObj = setTimeout(() => {
      console.log('timeout beyond time');
      var sourcePath = path.join(`./uploads/${rootFolder}/git-master-folder/tasks/`, 'main.yml');
      var destPath = path.join(`./uploads/${rootFolder}/git-master-folder/tasks/`, 'main.txt');
      fs.copyFile(sourcePath, destPath, (err) => {
        if (err) {
          console.log("Error Found:", err);
        }
        console.log("copy done");
        var stat = fs.statSync(destPath);
 
        res.writeHead(200, {
            'Content-Type': 'text/plain',
            'Content-Length': stat.size
        });
       var readStream = fs.createReadStream(destPath);
       readStream.pipe(res);
      });
  

   
    }, 200);
    //var myVar = setTimeout(myTimer(rootFolder, res), 1000);
    
    //var filePath = path.join(`./uploads/${rootFolder}/git-master-folder/tasks/`, 'main.yml');
    
    

 


  // res.setHeader('Content-disposition', `attachment; filename=theDocument.txt`);
  // res.setHeader('Content-type', 'text/plain');
  // res.charset = 'UTF-8';
  // res.write("Hello, world");
  // res.end();
 
  });
  
   

 
});

app.get('/download', (req, res) => {
  rootFolder =  req.query['rootFolder']
  console.log("rootFolder", rootFolder);
  //console.log("Host", req.headers['rootfolder'])
 
  zipFolder(rootFolder)
  const timeoutObj = setTimeout(() => {
    source_dir = `./uploads/${rootFolder}` 
  //var output = fs.createWriteStream(`${source_dir}/${rootFolder}.zip`);
  
  const archive = archiver("zip");
  console.log("loc", `${source_dir}/${rootFolder}.zip`)
  res.attachment(`${source_dir}/${rootFolder}.zip`);
  archive.pipe(res)
  archive.finalize();
  //Specifiy the .zip folder & Download
 
  }, 200);
  
  
   
  // }, 200);
  
  //res.send("microbot downloaded ");
});


function zipFolder(rootFolder){
  source_dir = `./uploads/${rootFolder}/` 
  // create a file to stream archive data to.
var output = fs.createWriteStream(`${source_dir}/${rootFolder}.zip`);
var archive = archiver('zip');
output.on('close', function () {
  console.log(archive.pointer() + ' total bytes');
  console.log('archiver has been finalized and the output file descriptor has closed.');
});
archive.on('error', function(err){
  throw err;
});

archive.pipe(output);

// append files from a sub-directory, putting its contents at the root of archive
archive.directory(source_dir, false)
archive.finalize();

}






app.listen(3000, () => {
  console.log('Server listening on port: ', 3000);
});

app.get('/getRootFolder', (req, res) => {
  randNumber = createDirectories("./uploads", "git-master-folder");
  res.status(200).json({ rootFolder: randNumber });
});