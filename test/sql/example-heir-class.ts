import { randomUUID } from "node:crypto";
import { StaticImplements } from "../../src/index.js";
import { BaseRecord, BaseRecordStaticMethods } from "./example-base-class";

@StaticImplements<BaseRecordStaticMethods<ApplicationRecord>>()
export class ApplicationRecord extends BaseRecord<ApplicationRecord> {
  constructor(data?: Partial<ApplicationRecord>) {
    super(data);
    if (data) this.assign(data);
    if (!this.api_key) this.api_key = randomUUID();
  }

  public static override table: string = `applications`;

  public api_key!: string;

  public app_name!: PublicKeyCredentialCreationOptions["rp"]["name"];

  public app_params!: { [key: string]: string | number | boolean | null };

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
