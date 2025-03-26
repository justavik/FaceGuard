@echo off
echo Starting Minikube if not running...
minikube status || minikube start --driver=docker

echo Setting Docker environment to Minikube...
@FOR /f "tokens=*" %%i IN ('minikube -p minikube docker-env --shell cmd') DO @%%i

echo Enabling metrics server for HPA...
minikube addons enable metrics-server

echo Building Docker image directly in Minikube...
docker build -t faceguard:latest .

echo Applying Kubernetes configurations...
kubectl delete -f k8s/deployment.yaml --ignore-not-found
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/pvc.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/hpa.yaml

echo Waiting for deployment to be ready...
kubectl wait --for=condition=available deployment/faceguard --timeout=300s

echo.
echo To access the application:
echo 1. Run: minikube service faceguard --url
echo 2. Open the URLs in your browser
echo.
echo To monitor pods: kubectl get pods -w
echo To check HPA: kubectl get hpa
echo To view logs: kubectl logs -l app=faceguard
pause 