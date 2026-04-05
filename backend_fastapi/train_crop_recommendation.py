# Crop Recommendation Model Training
# This script trains a RandomForestClassifier on crop_recommendation.csv and saves the model as crop_recommendation.pkl

import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import joblib

# Load data
DATA_PATH = "data/crop_recommendation.csv"
df = pd.read_csv(DATA_PATH)

# Features and target
X = df.drop("label", axis=1)
y = df["label"]

# Train/test split
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Model
clf = RandomForestClassifier(n_estimators=100, random_state=42)
clf.fit(X_train, y_train)

# Evaluate
preds = clf.predict(X_test)
acc = accuracy_score(y_test, preds)
print(f"Crop Recommendation Model Accuracy: {acc:.2f}")

# Save model
joblib.dump(clf, "models/crop_recommendation.pkl")
print("Model saved to models/crop_recommendation.pkl")
