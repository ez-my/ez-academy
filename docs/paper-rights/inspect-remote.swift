import Foundation
import PDFKit
import Vision
import AppKit
let root=URL(fileURLWithPath:CommandLine.arguments[1])
let records=try JSONSerialization.jsonObject(with:Data(contentsOf:root.appendingPathComponent("remote-results.json"))) as! [[String:Any]]
let lock=NSLock();var results=[[String:Any]]()
let queue=OperationQueue();queue.maxConcurrentOperationCount=4
for record in records where record["status"] as? String == "downloaded" || record["status"] as? String == "downloaded-image" {
 queue.addOperation {
  autoreleasepool {
   var row=record;var pages=[[String:Any]]()
   let doc=PDFDocument(url:URL(fileURLWithPath:record["path"] as! String))
   let count=doc?.pageCount ?? 1
   for i in 0..<count {
    autoreleasepool {
     let page=doc?.page(at:i),text=page?.string ?? ""
     var entry:[String:Any]=["page":i+1,"textCharacters":text.count,"textLabelHits":text.components(separatedBy:.whitespacesAndNewlines).filter{$0=="SULIT" || $0=="TERHAD"}]
     let img=page?.thumbnail(of:NSSize(width:1200,height:1700),for:.mediaBox) ?? NSImage(contentsOfFile:record["path"] as! String)
     if let cg=img?.cgImage(forProposedRect:nil,context:nil,hints:nil){
      do {
       let request=VNRecognizeTextRequest();request.recognitionLevel = .accurate;request.usesLanguageCorrection=false;request.recognitionLanguages=["en-US"]
       try VNImageRequestHandler(cgImage:cg).perform([request])
       let obs=request.results ?? [];entry["observations"]=obs.count
       entry["labelHits"]=obs.compactMap {o -> [String:Any]? in
        guard let s=o.topCandidates(1).first?.string,s.range(of:"\\b(SULIT|TERHAD)\\b",options:.regularExpression) != nil else{return nil}
        return ["label":s.contains("SULIT") ? "SULIT":"TERHAD","box":[o.boundingBox.minX,o.boundingBox.minY,o.boundingBox.width,o.boundingBox.height],"confidence":o.confidence]
       }
       entry["ocrStatus"]="inspected"
       if record["testId"] as? String == "kuala-lumpur" && record["kind"] as? String == "questionFileId" && i==0 {
        let rep=NSBitmapImageRep(cgImage:cg);try rep.representation(using:.png,properties:[:])?.write(to:root.appendingPathComponent("listening-original-cover.png"))
       }
      }catch{entry["ocrStatus"]="error";entry["error"]=String(describing:error)}
     }else{entry["ocrStatus"]="error";entry["error"]="Could not render"}
     pages.append(entry)
    }
   }
   row["pages"]=pages;row["pageCount"]=count
   row.removeValue(forKey:"error")
   lock.lock();results.append(row);lock.unlock()
  }
 }
}
queue.waitUntilAllOperationsAreFinished()
try JSONSerialization.data(withJSONObject:results,options:[.prettyPrinted,.sortedKeys]).write(to:root.appendingPathComponent("remote-inspection.json"))
print("Inspected \(results.count) documents")
