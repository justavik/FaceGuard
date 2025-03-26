@echo off
echo Cleaning up Kubernetes resources...
kubectl delete -f k8s/hpa.yaml
kubectl delete -f k8s/service.yaml
kubectl delete -f k8s/deployment.yaml
kubectl delete -f k8s/pvc.yaml
kubectl delete -f k8s/secret.yaml
kubectl delete -f k8s/configmap.yaml

echo.
echo To stop Minikube completely (optional), run: minikube stop
echo To delete Minikube VM (optional), run: minikube delete
pause 