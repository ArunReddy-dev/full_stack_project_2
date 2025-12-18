def serialize_mongo(doc):
    if not doc:
        return None

    doc["_id"] = str(doc["_id"])
    return doc
