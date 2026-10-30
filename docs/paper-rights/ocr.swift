import Foundation
import Vision
import ImageIO
let input = CommandLine.arguments[1]
let output = CommandLine.arguments[2]
let records = try JSONSerialization.jsonObject(with: Data(contentsOf: URL(fileURLWithPath: input))) as! [[String:Any]]
let lock = NSLock()
var results = [[String:Any]]()
let queue = OperationQueue(); queue.maxConcurrentOperationCount = 4
for record in records {
 queue.addOperation {
  autoreleasepool {
   var result: [String:Any] = ["imageSha256":record["imageSha256"]!,"testId":record["testId"]!,"part":record["part"]!,"page":record["page"]!]
   do {
    let request = VNRecognizeTextRequest()
    request.recognitionLevel = .accurate; request.usesLanguageCorrection = false; request.recognitionLanguages = ["en-US"]
    try VNImageRequestHandler(url:URL(fileURLWithPath:record["imagePath"] as! String)).perform([request])
    let observations = request.results ?? []
    result["observations"] = observations.count
    result["labelHits"] = observations.compactMap { o -> [String:Any]? in
     guard let text=o.topCandidates(1).first?.string, text.range(of:"\\b(SULIT|TERHAD)\\b",options:.regularExpression) != nil else {return nil}
     return ["label":text.contains("SULIT") ? "SULIT":"TERHAD","box":[o.boundingBox.minX,o.boundingBox.minY,o.boundingBox.width,o.boundingBox.height],"confidence":o.confidence]
    }
    result["status"] = "inspected"
   }catch{result["status"]="error";result["error"]=String(describing:error)}
   lock.lock();results.append(result);lock.unlock()
  }
 }
}
queue.waitUntilAllOperationsAreFinished()
try JSONSerialization.data(withJSONObject:results,options:[.prettyPrinted,.sortedKeys]).write(to:URL(fileURLWithPath:output))
print("Inspected \(results.count) images")
