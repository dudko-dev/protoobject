import { randomUUID } from "crypto";
import { StaticImplements } from "protoobject";
import { BaseRecord, BaseRecordStaticMethods } from "./example-base-class";

@StaticImplements<BaseRecordStaticMethods<ApplicationRecord>>()
export class ApplicationRecord extends BaseRecord<ApplicationRecord> {
  constructor(data?: Partial<ApplicationRecord>) {
    super(data);
    if (!(this as any).api_key) (this as any).api_key = randomUUID();
  }

  public static override table: string = `applications`;

  public static fromJSON<T>(data: { [key: string]: unknown }) {
    return new ApplicationRecord({
      ...super.fromJSON(data),
      app_params:
        typeof data?.app_params === "string"
          ? JSON.parse(data.app_params)
          : undefined,
    }) as T;
  }

  public toJSON(): { [key: string]: any } {
    return {
      ...super.toJSON.call(this),
      app_params: this.app_params ? JSON.stringify(this.app_params) : undefined,
    };
  }
}
