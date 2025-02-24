/*
ESP32 Face Recognition Trigger

This code implements a WiFi-connected button trigger for the FaceGuard facial recognition system.
When the button is pressed, it sends an HTTP POST request to trigger the face capture and
verification process on the server. The system uses button debouncing and maintains a persistent 
WiFi connection for reliable operation.
*/

#include <WiFi.h>
#include <HTTPClient.h>

// Configuration
const char* ssid = "Galaxy A232A55";
const char* password = "dwid7585";
const char* serverUrl = "http://192.168.90.171:3000/api/trigger-capture";
const int buttonPin = 12;

void setup() {
  Serial.begin(115200);
  pinMode(buttonPin, INPUT);  

  // Initialize WiFi connection
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
  
  // Handle button state changes
  if (buttonState != lastButtonState) {
    if (buttonState == LOW) {
      Serial.println("\n=== BUTTON PRESSED! ===");
      
      if (WiFi.status() == WL_CONNECTED) {
        HTTPClient http;
        
        Serial.println("Sending capture request...");
        http.begin(serverUrl);
        http.addHeader("Content-Type", "application/json");
        
        // Send capture trigger request
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
  
  delay(50);  // Debounce delay
}
