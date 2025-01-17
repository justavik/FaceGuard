#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "Galaxy A232A55";
const char* password = "dwid7585";
const char* serverUrl = "http://192.168.52.67:3000/api/trigger-capture";
const int buttonPin = 12;

void setup() {
  Serial.begin(115200);
  pinMode(buttonPin, INPUT);  // Regular INPUT mode, not PULLUP
  
  // Connect to WiFi
  Serial.println("\nConnecting to WiFi...");
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\nConnected!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  static int lastButtonState = HIGH;
  int buttonState = digitalRead(buttonPin);
  
  // Check for button press (transition from HIGH to LOW)
  if (buttonState != lastButtonState) {
    if (buttonState == LOW) {  // Button just pressed
      Serial.println("\n=== BUTTON PRESSED! ===");
      
      if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        
        Serial.println("Sending capture request...");
        http.begin(serverUrl);
        http.addHeader("Content-Type", "application/json");
        
        // Send the request
        int httpCode = http.POST("{\"trigger\":true}");
        
        if (httpCode > 0) {
          String response = http.getString();
          Serial.println("Response Code: " + String(httpCode));
          Serial.println("Response: " + response);
        } else {
          Serial.println("Error sending request");
        }
        
        http.end();
      }
    }
    lastButtonState = buttonState;
  }
  
  delay(50);  // Small delay for debouncing
}